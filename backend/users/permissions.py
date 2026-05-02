"""DRF permission-классы для разграничения доступа Admin / Manager."""

from rest_framework.permissions import BasePermission

from users.models import Role


class IsAdmin(BasePermission):
    """Разрешает только пользователям с ролью Admin."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == Role.ADMIN)


class IsAdminOrReadOnly(BasePermission):
    """Разрешает чтение всем аутентифицированным, запись — только Admin."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return user.role == Role.ADMIN


class CatalogPermission(BasePermission):
    """Справочники: чтение и создание/изменение всем аутентифицированным;
    удаление — только Admin."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method == 'DELETE':
            return user.role == Role.ADMIN
        return True


class UsersPermission(BasePermission):
    """Управление пользователями: всё разрешено только Admin,
    кроме action 'me' — доступен любому аутентифицированному."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if getattr(view, 'action', None) == 'me':
            return True
        return user.role == Role.ADMIN
