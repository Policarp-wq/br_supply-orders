from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from catalog.models import Product, Supplier
from users.models import Role, User


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def admin_user(db) -> User:
    return User.objects.create_user(
        username='admin',
        password='admin123',
        email='admin@local',
        role=Role.ADMIN,
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def manager_user(db) -> User:
    return User.objects.create_user(
        username='manager',
        password='manager123',
        email='manager@local',
        role=Role.MANAGER,
    )


@pytest.fixture
def auth_admin(api_client: APIClient, admin_user: User) -> APIClient:
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def auth_manager(api_client: APIClient, manager_user: User) -> APIClient:
    api_client.force_authenticate(user=manager_user)
    return api_client


@pytest.fixture
def supplier(db) -> Supplier:
    return Supplier.objects.create(
        name='ООО Поставщик',
        inn='7700000001',
        contact_email='s@example.com',
        phone='+7 495 000-00-00',
    )


@pytest.fixture
def product(supplier: Supplier) -> Product:
    return Product.objects.create(
        supplier=supplier,
        name='Товар A',
        sku='SKU-A',
        unit_price=Decimal('100.00'),
    )


@pytest.fixture
def product_b(supplier: Supplier) -> Product:
    return Product.objects.create(
        supplier=supplier,
        name='Товар B',
        sku='SKU-B',
        unit_price=Decimal('250.00'),
    )
