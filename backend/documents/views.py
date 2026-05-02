from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from documents.models import Order, Supply
from documents.serializers import OrderSerializer, SupplySerializer
from documents.services import assemble_order, receive_supply, ship_order


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

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        supply = self.get_object()
        receive_supply(supply)
        supply.refresh_from_db()
        return Response(self.get_serializer(supply).data)


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

    @action(detail=True, methods=['post'])
    def assemble(self, request, pk=None):
        order = self.get_object()
        assemble_order(order)
        order.refresh_from_db()
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        order = self.get_object()
        ship_order(order)
        order.refresh_from_db()
        return Response(self.get_serializer(order).data)
