from django.contrib import admin

from documents.models import Order, OrderItem, Supply, SupplyItem


class SupplyItemInline(admin.TabularInline):
    model = SupplyItem
    extra = 0
    autocomplete_fields = ('product',)
    fields = ('product', 'quantity', 'unit_price')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    autocomplete_fields = ('product',)
    fields = ('product', 'quantity', 'unit_price')


@admin.register(Supply)
class SupplyAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier', 'status', 'received_at', 'created_at')
    list_filter = ('status', 'supplier')
    autocomplete_fields = ('supplier',)
    readonly_fields = ('received_at', 'created_at', 'updated_at')
    inlines = [SupplyItemInline]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'status', 'shipped_at', 'created_at')
    list_filter = ('status',)
    search_fields = ('customer_name',)
    readonly_fields = ('shipped_at', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
