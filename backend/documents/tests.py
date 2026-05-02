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
