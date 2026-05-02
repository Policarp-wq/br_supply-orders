from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Supplier(models.Model):
    """Поставщик товаров."""

    name = models.CharField(max_length=200, verbose_name='Название')
    inn = models.CharField(
        max_length=12,
        unique=True,
        verbose_name='ИНН',
        help_text='10 или 12 цифр',
    )
    contact_email = models.EmailField(blank=True, verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Телефон')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Поставщик'
        verbose_name_plural = 'Поставщики'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    """Товар на складе оптовой компании."""

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name='Поставщик',
    )
    name = models.CharField(max_length=200, verbose_name='Наименование')
    sku = models.CharField(max_length=50, unique=True, verbose_name='Артикул')
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='Цена за единицу',
    )
    quantity_in_stock = models.PositiveIntegerField(
        default=0,
        verbose_name='Остаток на складе',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['name']

    def __str__(self) -> str:
        return f'{self.name} ({self.sku})'
