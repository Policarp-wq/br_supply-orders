# Веб-сервис управления поставками и заказами в оптовых компаниях

Курсовая работа: веб-приложение, автоматизирующее работу оператора оптовой компании со справочниками поставщиков и товаров, документами поставок и заказами клиентов.

## Технологический стек

| Слой        | Технология                                    |
|-------------|-----------------------------------------------|
| Backend     | Python 3.12, Django 5, Django REST Framework  |
| База данных | PostgreSQL 16                                 |
| Auth        | JWT (`djangorestframework-simplejwt`)         |
| Frontend    | TypeScript, React 18, Vite, MUI, React Router |
| Паттерн     | MVT (Django) + SPA-клиент через REST          |
| IDE         | Visual Studio Code                            |

## Доменная модель

Шесть таблиц (плюс таблица пользователей Django):

- **Supplier** — поставщик (название, ИНН, контакты).
- **Product** — товар (наименование, артикул, цена, остаток на складе, ссылка на поставщика).
- **Supply** — документ поставки (поставщик, дата, статус: `pending → received`).
- **SupplyItem** — позиция поставки (товар, количество, цена).
- **Order** — заказ клиента (клиент, дата, статус: `new → assembled → shipped`).
- **OrderItem** — позиция заказа (товар, количество, цена).

## Бизнес-правила

- Перевод поставки в статус `received` увеличивает остаток товаров на складе на количество в позициях.
- Перевод заказа в статус `shipped` уменьшает остаток на количество в позициях; при недостаче переход блокируется.
- Переходы статусов реализованы как отдельные действия REST API, а не свободные `PATCH status`.

## Роли

- **Admin** — полные права на справочники и документы.
- **Manager** — создание заказов и поставок, переходы статусов; без удаления справочников.

## Структура репозитория

- `backend/` — Django-проект.
- `frontend/` — React-приложение.
- `docker-compose.yml` — продакшен-запуск из образов на Docker Hub.
- `docker-compose.dev.yml` — локальный запуск со сборкой из исходников.

## Запуск

### Локально из исходников

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec backend python manage.py seed_demo
```

Открыть http://localhost/, логин `admin` / `admin`.

### На VPS из образов Docker Hub

CI публикует образы `<DOCKER_USERNAME>/br_supply_orders_backend` и `<DOCKER_USERNAME>/br_supply_orders_frontend` на каждый push. Для запуска нужны Docker, docker compose и открытый порт 80.

```bash
git clone https://github.com/Policarp-wq/br_supply-orders.git
cd br_supply-orders
cp .env.example .env
# отредактировать .env: указать DOCKER_USERNAME и сменить DJANGO_SECRET_KEY
docker compose pull
docker compose up -d
docker compose exec backend python manage.py seed_demo
```

Открыть http://<ip-vps>/.

## План реализации

1. Скелет монорепо: backend, frontend, docker-compose с PostgreSQL.
2. Доменная модель и миграции Django.
3. REST API: ViewSet'ы DRF, JWT-аутентификация, разграничение прав.
4. Каркас фронта: React Router, axios-клиент, AuthContext.
5. CRUD-страницы по каждой сущности (список, форма, деталь) на MUI.
6. Навигация: AppBar и Drawer, защищённые маршруты.
7. Демо-данные: фикстуры или management-команда.
8. Документация: ER-диаграмма, диаграмма компонентов, описание REST.

## Лицензия

MIT, см. [LICENSE](LICENSE).
