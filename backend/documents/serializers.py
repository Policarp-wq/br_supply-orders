from django.db import transaction
from rest_framework import serializers

from documents.models import Order, OrderItem, Supply, SupplyItem


class SupplyItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = SupplyItem
        fields = (
            'id',
            'product',
            'product_name',
            'product_sku',
            'quantity',
            'unit_price',
        )
        read_only_fields = ('id',)


class SupplySerializer(serializers.ModelSerializer):
    items = SupplyItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Supply
        fields = (
            'id',
            'supplier',
            'supplier_name',
            'status',
            'status_display',
            'received_at',
            'created_at',
            'updated_at',
            'items',
        )
        read_only_fields = (
            'id',
            'status',
            'received_at',
            'created_at',
            'updated_at',
        )

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Поставка должна содержать хотя бы одну позицию.')
        product_ids = [item['product'].pk for item in value]
        if len(set(product_ids)) != len(product_ids):
            raise serializers.ValidationError(
                'Один и тот же товар не может встречаться в позициях более одного раза.',
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        supply = Supply.objects.create(**validated_data)
        for item in items_data:
            SupplyItem.objects.create(supply=supply, **item)
        return supply

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                SupplyItem.objects.create(supply=instance, **item)
        return instance


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            'id',
            'product',
            'product_name',
            'product_sku',
            'quantity',
            'unit_price',
        )
        read_only_fields = ('id',)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'customer_name',
            'status',
            'status_display',
            'shipped_at',
            'created_at',
            'updated_at',
            'items',
            'total_amount',
        )
        read_only_fields = (
            'id',
            'status',
            'shipped_at',
            'created_at',
            'updated_at',
            'total_amount',
        )

    def get_total_amount(self, obj):
        return sum((item.unit_price * item.quantity for item in obj.items.all()), start=0)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Заказ должен содержать хотя бы одну позицию.')
        product_ids = [item['product'].pk for item in value]
        if len(set(product_ids)) != len(product_ids):
            raise serializers.ValidationError(
                'Один и тот же товар не может встречаться в позициях более одного раза.',
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                OrderItem.objects.create(order=instance, **item)
        return instance
