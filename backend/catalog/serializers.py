from rest_framework import serializers

from catalog.models import Product, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            'id',
            'name',
            'inn',
            'contact_email',
            'phone',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'sku',
            'unit_price',
            'quantity_in_stock',
            'supplier',
            'supplier_name',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'quantity_in_stock',
            'created_at',
            'updated_at',
        )
