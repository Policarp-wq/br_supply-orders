from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from catalog.models import Product, Supplier


class SupplyStatus(models.TextChoices):
    PENDING = 'pending', 'Ожидается'
    RECEIVED = 'received', 'Принята'


class OrderStatus(models.TextChoices):
    NEW = 'new', 'Новый'
    ASSEMBLED = 'assembled', 'Собран'
    SHIPPED = 'shipped', 'Отгружен'


class Supply(models.Model):
    """Документ поставки от поставщика."""

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='supplies',
        verbose_name='Поставщик',
    )
    status = models.CharField(
        max_length=20,
        choices=SupplyStatus.choices,
        default=SupplyStatus.PENDING,
        verbose_name='Статус',
    )
    received_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата приёма',
        help_text='Заполняется автоматически при переходе в статус «Принята»',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлена')

    class Meta:
        verbose_name = 'Поставка'
        verbose_name_plural = 'Поставки'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Поставка #{self.pk} от {self.supplier.name} ({self.get_status_display()})'


class SupplyItem(models.Model):
    """Позиция в документе поставки."""

    supply = models.ForeignKey(
        Supply,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Поставка',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='supply_items',
        verbose_name='Товар',
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Количество',
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Цена за единицу на момент поставки',
    )

    class Meta:
        verbose_name = 'Позиция поставки'
        verbose_name_plural = 'Позиции поставок'
        constraints = [
            models.UniqueConstraint(
                fields=['supply', 'product'],
                name='unique_supply_product',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.product.sku} × {self.quantity}'


class Order(models.Model):
    """Заказ клиента."""

    customer_name = models.CharField(max_length=200, verbose_name='Клиент')
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.NEW,
        verbose_name='Статус',
    )
    shipped_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата отгрузки',
        help_text='Заполняется автоматически при переходе в статус «Отгружен»',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Заказ #{self.pk} для {self.customer_name} ({self.get_status_display()})'


class OrderItem(models.Model):
    """Позиция в заказе клиента."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items',
        verbose_name='Товар',
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Количество',
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Цена за единицу на момент заказа',
    )

    class Meta:
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказов'
        constraints = [
            models.UniqueConstraint(
                fields=['order', 'product'],
                name='unique_order_product',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.product.sku} × {self.quantity}'
