"""Бизнес-операции переходов статусов с эффектами на остаток товара."""

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalog.models import Product
from documents.models import Order, OrderStatus, Supply, SupplyStatus


@transaction.atomic
def receive_supply(supply: Supply) -> Supply:
    """Принять поставку: остатки товаров увеличиваются на количество в позициях."""
    if supply.status != SupplyStatus.PENDING:
        raise ValidationError(
            {'detail': 'Принять можно только поставку в статусе «Ожидается».'},
        )

    items = list(supply.items.select_related('product').all())
    if not items:
        raise ValidationError({'detail': 'Невозможно принять поставку без позиций.'})

    product_ids = [item.product_id for item in items]
    products = {
        p.pk: p
        for p in Product.objects.select_for_update().filter(pk__in=product_ids)
    }

    for item in items:
        product = products[item.product_id]
        product.quantity_in_stock += item.quantity
        product.save(update_fields=['quantity_in_stock', 'updated_at'])

    supply.status = SupplyStatus.RECEIVED
    supply.received_at = timezone.now()
    supply.save(update_fields=['status', 'received_at', 'updated_at'])
    return supply


@transaction.atomic
def assemble_order(order: Order) -> Order:
    """Перевести заказ в статус «Собран» — остатки не трогаем, только статус."""
    if order.status != OrderStatus.NEW:
        raise ValidationError(
            {'detail': 'Собрать можно только заказ в статусе «Новый».'},
        )
    order.status = OrderStatus.ASSEMBLED
    order.save(update_fields=['status', 'updated_at'])
    return order


@transaction.atomic
def ship_order(order: Order) -> Order:
    """Отгрузить заказ: остатки уменьшаются; при недостаче — ValidationError."""
    if order.status != OrderStatus.ASSEMBLED:
        raise ValidationError(
            {'detail': 'Отгрузить можно только заказ в статусе «Собран».'},
        )

    items = list(order.items.select_related('product').all())
    if not items:
        raise ValidationError({'detail': 'Невозможно отгрузить заказ без позиций.'})

    product_ids = [item.product_id for item in items]
    products = {
        p.pk: p
        for p in Product.objects.select_for_update().filter(pk__in=product_ids)
    }

    insufficient = []
    for item in items:
        product = products[item.product_id]
        if product.quantity_in_stock < item.quantity:
            insufficient.append(
                f'«{product.name}»: нужно {item.quantity}, на складе {product.quantity_in_stock}',
            )
    if insufficient:
        raise ValidationError(
            {'detail': 'Недостаточно остатка для отгрузки: ' + '; '.join(insufficient) + '.'},
        )

    for item in items:
        product = products[item.product_id]
        product.quantity_in_stock -= item.quantity
        product.save(update_fields=['quantity_in_stock', 'updated_at'])

    order.status = OrderStatus.SHIPPED
    order.shipped_at = timezone.now()
    order.save(update_fields=['status', 'shipped_at', 'updated_at'])
    return order
