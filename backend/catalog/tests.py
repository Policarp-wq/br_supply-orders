from decimal import Decimal

import pytest

from catalog.models import Product

pytestmark = pytest.mark.django_db


def test_supplier_list_requires_auth(api_client):
    response = api_client.get('/api/suppliers/')
    assert response.status_code == 401


def test_supplier_create_and_list(auth_admin):
    create = auth_admin.post(
        '/api/suppliers/',
        {'name': 'ИП Поставщик', 'inn': '7700000099', 'contact_email': 'x@y.ru', 'phone': ''},
        format='json',
    )
    assert create.status_code == 201, create.data

    listing = auth_admin.get('/api/suppliers/')
    assert listing.status_code == 200
    assert any(s['inn'] == '7700000099' for s in listing.data['results'])


def test_product_create_returns_supplier_name(auth_admin, supplier):
    response = auth_admin.post(
        '/api/products/',
        {
            'name': 'Товар X',
            'sku': 'SKU-X',
            'unit_price': '99.50',
            'supplier': supplier.pk,
        },
        format='json',
    )
    assert response.status_code == 201, response.data
    assert response.data['supplier_name'] == supplier.name
    assert response.data['quantity_in_stock'] == 0


def test_quantity_in_stock_is_read_only_on_patch(auth_admin, product):
    response = auth_admin.patch(
        f'/api/products/{product.pk}/',
        {'quantity_in_stock': 999},
        format='json',
    )
    assert response.status_code == 200
    product.refresh_from_db()
    assert product.quantity_in_stock == 0


def test_supplier_inn_must_be_unique(auth_admin, supplier):
    response = auth_admin.post(
        '/api/suppliers/',
        {'name': 'Дубль', 'inn': supplier.inn},
        format='json',
    )
    assert response.status_code == 400
    assert 'inn' in response.data
