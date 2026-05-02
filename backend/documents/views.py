from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from documents.models import Order, Supply
from documents.serializers import OrderSerializer, SupplySerializer


class SupplyViewSet(viewsets.ModelViewSet):
    queryset = (
        Supply.objects
        .select_related('supplier')
        .prefetch_related('items__product')
        .all()
    )
    serializer_class = SupplySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'received_at', 'status']
    ordering = ['-created_at']


class OrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects
        .prefetch_related('items__product')
        .all()
    )
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer_name']
    ordering_fields = ['created_at', 'shipped_at', 'status']
    ordering = ['-created_at']
