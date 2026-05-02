from rest_framework import filters, viewsets

from catalog.models import Product, Supplier
from catalog.serializers import ProductSerializer, SupplierSerializer
from users.permissions import CatalogPermission


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [CatalogPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'inn']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('supplier').all()
    serializer_class = ProductSerializer
    permission_classes = [CatalogPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku']
    ordering_fields = ['name', 'unit_price', 'quantity_in_stock', 'created_at']
    ordering = ['name']
