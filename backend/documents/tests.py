import pytest

from documents.models import Order, OrderStatus, Supply, SupplyStatus

pytestmark = pytest.mark.django_db


def test_create_supply_with_nested_items(auth_admin, supplier, product, product_b):
    payload = {
        'supplier': supplier.pk,
        'items': [
            {'product': product.pk, 'quantity': 10, 'unit_price': '100.00'},
            {'product': product_b.pk, 'quantity': 5, 'unit_price': '250.00'},
        ],
    }
    response = auth_admin.post('/api/supplies/', payload, format='json')
    assert response.status_code == 201, response.data
    supply = Supply.objects.get(pk=response.data['id'])
    assert supply.status == SupplyStatus.PENDING
    assert supply.items.count() == 2
    assert response.data['status_display'] == 'Ожидается'
    assert response.data['supplier_name'] == supplier.name


def test_supply_rejects_empty_items(auth_admin, supplier):
    response = auth_admin.post(
        '/api/supplies/',
        {'supplier': supplier.pk, 'items': []},
        format='json',
    )
    assert response.status_code == 400
    assert 'items' in response.data


def test_supply_rejects_duplicate_product_in_items(auth_admin, supplier, product):
    payload = {
        'supplier': supplier.pk,
        'items': [
            {'product': product.pk, 'quantity': 1, 'unit_price': '1.00'},
            {'product': product.pk, 'quantity': 2, 'unit_price': '2.00'},
        ],
    }
    response = auth_admin.post('/api/supplies/', payload, format='json')
    assert response.status_code == 400
    assert 'items' in response.data


def test_create_order_with_total_amount(auth_admin, product, product_b):
    payload = {
        'customer_name': 'ИП Клиент',
        'items': [
            {'product': product.pk, 'quantity': 2, 'unit_price': '110.00'},
            {'product': product_b.pk, 'quantity': 1, 'unit_price': '260.00'},
        ],
    }
    response = auth_admin.post('/api/orders/', payload, format='json')
    assert response.status_code == 201, response.data
    assert response.data['status'] == OrderStatus.NEW
    assert response.data['total_amount'] == 480
    order = Order.objects.get(pk=response.data['id'])
    assert order.items.count() == 2


def test_supply_list_returns_existing(auth_admin, supplier, product):
    auth_admin.post(
        '/api/supplies/',
        {
            'supplier': supplier.pk,
            'items': [{'product': product.pk, 'quantity': 1, 'unit_price': '1.00'}],
        },
        format='json',
    )
    response = auth_admin.get('/api/supplies/')
    assert response.status_code == 200
    assert response.data['count'] == 1


# --- Status transitions ---

def _create_supply(client, supplier, product, qty=10):
    response = client.post(
        '/api/supplies/',
        {
            'supplier': supplier.pk,
            'items': [{'product': product.pk, 'quantity': qty, 'unit_price': '100.00'}],
        },
        format='json',
    )
    assert response.status_code == 201, response.data
    return response.data


def _create_order(client, product, qty=3):
    response = client.post(
        '/api/orders/',
        {
            'customer_name': 'ИП Клиент',
            'items': [{'product': product.pk, 'quantity': qty, 'unit_price': '120.00'}],
        },
        format='json',
    )
    assert response.status_code == 201, response.data
    return response.data


def test_receive_supply_increments_stock(auth_admin, supplier, product):
    supply = _create_supply(auth_admin, supplier, product, qty=15)
    assert product.quantity_in_stock == 0

    response = auth_admin.post(f'/api/supplies/{supply["id"]}/receive/')
    assert response.status_code == 200, response.data
    assert response.data['status'] == SupplyStatus.RECEIVED
    assert response.data['received_at'] is not None

    product.refresh_from_db()
    assert product.quantity_in_stock == 15


def test_receive_supply_blocks_double_receive(auth_admin, supplier, product):
    supply = _create_supply(auth_admin, supplier, product)
    auth_admin.post(f'/api/supplies/{supply["id"]}/receive/')
    response = auth_admin.post(f'/api/supplies/{supply["id"]}/receive/')
    assert response.status_code == 400


def test_assemble_order_changes_status(auth_admin, product):
    order = _create_order(auth_admin, product)
    response = auth_admin.post(f'/api/orders/{order["id"]}/assemble/')
    assert response.status_code == 200, response.data
    assert response.data['status'] == OrderStatus.ASSEMBLED


def test_ship_order_decrements_stock(auth_admin, supplier, product):
    supply = _create_supply(auth_admin, supplier, product, qty=10)
    auth_admin.post(f'/api/supplies/{supply["id"]}/receive/')
    product.refresh_from_db()
    assert product.quantity_in_stock == 10

    order = _create_order(auth_admin, product, qty=3)
    auth_admin.post(f'/api/orders/{order["id"]}/assemble/')
    response = auth_admin.post(f'/api/orders/{order["id"]}/ship/')
    assert response.status_code == 200, response.data
    assert response.data['status'] == OrderStatus.SHIPPED
    assert response.data['shipped_at'] is not None

    product.refresh_from_db()
    assert product.quantity_in_stock == 7


def test_ship_order_fails_when_insufficient_stock(auth_admin, product):
    order = _create_order(auth_admin, product, qty=99)
    auth_admin.post(f'/api/orders/{order["id"]}/assemble/')
    response = auth_admin.post(f'/api/orders/{order["id"]}/ship/')
    assert response.status_code == 400
    assert 'detail' in response.data
    product.refresh_from_db()
    assert product.quantity_in_stock == 0


def test_ship_requires_assembled_status(auth_admin, product):
    order = _create_order(auth_admin, product, qty=1)
    response = auth_admin.post(f'/api/orders/{order["id"]}/ship/')
    assert response.status_code == 400
