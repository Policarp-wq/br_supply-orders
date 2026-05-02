from django.contrib import admin

from catalog.models import Product, Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'inn', 'contact_email', 'phone')
    search_fields = ('name', 'inn')
    ordering = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'supplier', 'unit_price', 'quantity_in_stock')
    list_filter = ('supplier',)
    search_fields = ('name', 'sku')
    ordering = ('name',)
    autocomplete_fields = ('supplier',)
