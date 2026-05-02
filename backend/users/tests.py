import pytest

from users.models import User

pytestmark = pytest.mark.django_db


def test_me_returns_current_user(auth_admin):
    response = auth_admin.get('/api/users/me/')
    assert response.status_code == 200
    assert response.data['username'] == 'admin'
    assert response.data['role'] == 'admin'
    assert response.data['role_display'] == 'Администратор'


def test_me_requires_auth(api_client):
    response = api_client.get('/api/users/me/')
    assert response.status_code == 401


def test_users_list_visible_to_authenticated(auth_admin, manager_user):
    response = auth_admin.get('/api/users/')
    assert response.status_code == 200
    usernames = {u['username'] for u in response.data['results']}
    assert 'admin' in usernames
    assert 'manager' in usernames


def test_login_returns_tokens_and_user_with_role(api_client, manager_user):
    response = api_client.post(
        '/api/auth/login/',
        {'username': 'manager', 'password': 'manager123'},
        format='json',
    )
    assert response.status_code == 200, response.data
    assert 'access' in response.data
    assert 'refresh' in response.data
    assert response.data['user']['username'] == 'manager'
    assert response.data['user']['role'] == 'manager'
    assert response.data['user']['role_display'] == 'Менеджер'


def test_login_jwt_claims_include_role(api_client, admin_user):
    import jwt
    from django.conf import settings

    response = api_client.post(
        '/api/auth/login/',
        {'username': 'admin', 'password': 'admin123'},
        format='json',
    )
    assert response.status_code == 200
    payload = jwt.decode(
        response.data['access'],
        settings.SECRET_KEY,
        algorithms=['HS256'],
    )
    assert payload['role'] == 'admin'
    assert payload['username'] == 'admin'


def test_login_with_wrong_password_fails(api_client, admin_user):
    response = api_client.post(
        '/api/auth/login/',
        {'username': 'admin', 'password': 'wrong'},
        format='json',
    )
    assert response.status_code == 401


# --- Permissions ---

def test_manager_cannot_list_users(auth_manager):
    response = auth_manager.get('/api/users/')
    assert response.status_code == 403


def test_manager_can_access_me(auth_manager):
    response = auth_manager.get('/api/users/me/')
    assert response.status_code == 200
    assert response.data['role'] == 'manager'


def test_manager_cannot_create_user(auth_manager):
    response = auth_manager.post(
        '/api/users/',
        {'username': 'new', 'password': 'pwd', 'role': 'manager'},
        format='json',
    )
    assert response.status_code == 403


# --- seed_demo management command ---

def test_seed_demo_populates_db(db):
    from django.core.management import call_command
    from catalog.models import Product, Supplier
    from documents.models import Order, Supply

    call_command('seed_demo', verbosity=0)
    assert User.objects.filter(username='admin').exists()
    assert User.objects.filter(username='manager').exists()
    assert Supplier.objects.count() == 3
    assert Product.objects.count() == 10
    assert Supply.objects.count() == 2
    assert Order.objects.count() == 2


def test_seed_demo_is_idempotent(db):
    from django.core.management import call_command
    from catalog.models import Product, Supplier

    call_command('seed_demo', verbosity=0)
    call_command('seed_demo', verbosity=0)
    assert Supplier.objects.count() == 3
    assert Product.objects.count() == 10
