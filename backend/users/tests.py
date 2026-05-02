import pytest


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
