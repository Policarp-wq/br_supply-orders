"""Заполняет БД демо-данными для презентации курсовой работы."""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Product, Supplier
from documents.models import Order, OrderItem, Supply, SupplyItem
from users.models import Role, User


SUPPLIERS = [
    ('ООО ОптТорг',     '7700000001', 'opt@example.com',  '+7 495 100-10-10'),
    ('ООО ТехноСнаб',   '7700000002', 'tech@example.com', '+7 495 200-20-20'),
    ('ИП Иванов И.И.',  '7700000003', 'ivanov@example.com', '+7 495 300-30-30'),
]

PRODUCTS = [
    # (sku, name, supplier_index, unit_price)
    ('SKU-001', 'Кофе зерновой 1кг',     0, '950.00'),
    ('SKU-002', 'Чай чёрный 250г',       0, '320.00'),
    ('SKU-003', 'Сахар-песок 1кг',       0, '85.00'),
    ('SKU-004', 'Молоко 1л',             1, '95.00'),
    ('SKU-005', 'Мука пшеничная 2кг',    1, '180.00'),
    ('SKU-006', 'Масло сливочное 200г',  1, '290.00'),
    ('SKU-007', 'Хлеб бородинский',      2, '65.00'),
    ('SKU-008', 'Соль 1кг',              2, '40.00'),
    ('SKU-009', 'Уксус 9% 0.5л',         2, '70.00'),
    ('SKU-010', 'Подсолнечное масло 1л', 2, '160.00'),
]


class Command(BaseCommand):
    help = 'Заполняет БД демо-данными (пользователи, поставщики, товары, документы).'

    @transaction.atomic
    def handle(self, *args, **options):
        admin, _ = User.objects.update_or_create(
            username='admin',
            defaults={
                'email': 'admin@local',
                'role': Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin.set_password('admin')
        admin.save()

        manager, _ = User.objects.update_or_create(
            username='manager',
            defaults={'email': 'manager@local', 'role': Role.MANAGER},
        )
        manager.set_password('manager')
        manager.save()

        suppliers = []
        for name, inn, email, phone in SUPPLIERS:
            supplier, _ = Supplier.objects.update_or_create(
                inn=inn,
                defaults={'name': name, 'contact_email': email, 'phone': phone},
            )
            suppliers.append(supplier)

        products = []
        for sku, name, supplier_idx, price in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'supplier': suppliers[supplier_idx],
                    'unit_price': Decimal(price),
                },
            )
            products.append(product)

        if not Supply.objects.exists():
            sup1 = Supply.objects.create(supplier=suppliers[0])
            SupplyItem.objects.create(
                supply=sup1, product=products[0], quantity=50,
                unit_price=products[0].unit_price,
            )
            SupplyItem.objects.create(
                supply=sup1, product=products[1], quantity=30,
                unit_price=products[1].unit_price,
            )

            sup2 = Supply.objects.create(supplier=suppliers[1])
            SupplyItem.objects.create(
                supply=sup2, product=products[3], quantity=100,
                unit_price=products[3].unit_price,
            )

        if not Order.objects.exists():
            order1 = Order.objects.create(customer_name='Кафе «Утро»')
            OrderItem.objects.create(
                order=order1, product=products[0], quantity=2,
                unit_price=Decimal('1000.00'),
            )
            OrderItem.objects.create(
                order=order1, product=products[2], quantity=10,
                unit_price=Decimal('100.00'),
            )

            order2 = Order.objects.create(customer_name='Магазин «Перекрёсток»')
            OrderItem.objects.create(
                order=order2, product=products[3], quantity=20,
                unit_price=Decimal('100.00'),
            )

        self.stdout.write(self.style.SUCCESS('Демо-данные созданы.'))
        self.stdout.write('  Логины: admin/admin (Admin), manager/manager (Manager)')
        self.stdout.write(f'  Поставщиков: {Supplier.objects.count()}')
        self.stdout.write(f'  Товаров: {Product.objects.count()}')
        self.stdout.write(f'  Поставок: {Supply.objects.count()}')
        self.stdout.write(f'  Заказов: {Order.objects.count()}')
