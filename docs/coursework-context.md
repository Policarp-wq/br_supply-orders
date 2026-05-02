# Контекст для текста курсовой и диаграмм

Файл собирает всё необходимое: тему, требования, архитектурные решения, доменную модель, бизнес-правила, контракт API, схему БД, структуру кода, правила деплоя, тесты. По нему пишется текстовая часть курсовой и рисуются ER / компонентная / sequence / state-диаграммы.

---

## 1. Тема и формальные требования

**Тема:** «Веб-сервис управления поставками и заказами в оптовых компаниях».

**Перечень требований из задания:**
- Языки программирования: Python, TypeScript.
- Фреймворки: Django (бэкенд), React (фронтенд).
- Среды разработки: Visual Studio Code.
- API и взаимодействие с фронтендом: REST API.
- СУБД: PostgreSQL.
- Наличие межстраничной навигации.
- Внешний вид страниц соответствует современным стандартам веб-разработки.
- Использование паттерна проектирования: MVT.
- Разработка архитектуры на основе выбранного паттерна.
- Реализация серверной логики, слоя БД и клиентского представления.

---

## 2. Стек технологий и обоснование

| Слой | Технология | Назначение |
|---|---|---|
| Бэкенд | Python 3.12, Django 5.2, Django REST Framework 3.17 | Серверная логика, REST API |
| Аутентификация | djangorestframework-simplejwt 5.5 | JWT-токены (access + refresh) |
| Документация API | drf-spectacular 0.29 | OpenAPI 3 + Swagger UI |
| База данных | PostgreSQL 16 | Реляционное хранилище |
| ORM | Django ORM, psycopg 3 | Маппинг таблиц на модели |
| Фронтенд | TypeScript, React 19, Vite 8 | SPA-приложение |
| UI-библиотека | Material UI 9 + MUI X DataGrid | Современный визуальный стиль |
| HTTP-клиент | axios 1.15 | Запросы к REST API |
| Маршрутизация | react-router-dom 7 | Межстраничная навигация в SPA |
| Тесты бэкенда | pytest 9 + pytest-django 4 | 34 теста |
| Тесты фронтенда | Vitest 4 + @testing-library/react | 15 тестов |
| Контейнеризация | Docker, docker compose | Локальный запуск всего стека |
| Прокси | nginx 1.27 | Раздача SPA + проксирование `/api/`, `/admin/` на бэкенд |

**Обоснование ключевых решений:**
- **Django + DRF** — стандарт для быстрой разработки REST-сервисов на Python; готовая админка ускоряет проверку моделей.
- **React + TypeScript** — индустриальный стандарт для современных SPA; типизация ловит ошибки контракта с API на этапе компиляции.
- **PostgreSQL** — надёжная реляционная СУБД, поддерживает транзакционные обновления остатков на складе с блокировкой строк (`SELECT FOR UPDATE`).
- **JWT** — stateless аутентификация, удобна для разделения фронта и бэка.
- **Сервисный слой** на бэкенде (`documents/services.py`) — отделяет бизнес-операции от HTTP-слоя; легко тестировать изолированно.
- **Кастомная модель User** — позволяет хранить роль пользователя как отдельное поле, а не через Django-группы.

---

## 3. Архитектура и интерпретация паттерна MVT

В классическом Django MVT:
- **M (Model)** — модели ORM, описывают таблицы БД.
- **V (View)** — обработчики запросов.
- **T (Template)** — серверные HTML-шаблоны.

В данном проекте используется современная SPA-интерпретация MVT:
- **M** — Django-модели (`users.User`, `catalog.Supplier`, `catalog.Product`, `documents.Supply`, `documents.SupplyItem`, `documents.Order`, `documents.OrderItem`).
- **V** — DRF ViewSet'ы (`SupplierViewSet`, `ProductViewSet`, `SupplyViewSet`, `OrderViewSet`, `UserViewSet`), отдают JSON.
- **T** — роль шаблона выполняет React-приложение, которое получает JSON от V и рендерит HTML на стороне клиента.

**Граница клиент/сервер:** REST API под `/api/`. Frontend и backend деплоятся как отдельные процессы; в продакшен-сборке nginx раздаёт статический build SPA и проксирует `/api/`, `/admin/`, `/static/` на Django.

**Поток данных (для sequence-диаграмм):**
1. Login: Browser → nginx → Django `/api/auth/login/` → проверка пароля → JWT (access+refresh) → ответ → React сохраняет в localStorage.
2. CRUD: Browser → axios + Bearer token → nginx → DRF ViewSet → ORM → PostgreSQL → ответ JSON → React обновляет состояние.
3. Принять поставку: React POST → `/api/supplies/{id}/receive/` → ViewSet @action → `services.receive_supply` (внутри `transaction.atomic`) → `SELECT FOR UPDATE` Product → инкремент `quantity_in_stock` → апдейт статуса Supply → JSON.
4. Отгрузить заказ: аналогично, но с проверкой остатка и декрементом; при недостаче — 400 с детальным сообщением.

---

## 4. Доменная модель

Шесть основных сущностей плюс расширенный пользователь.

### 4.1. User (приложение `users`)
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| username | CharField | unique, наследуется от AbstractUser |
| email | EmailField | |
| password | CharField | hashed |
| first_name, last_name | CharField | |
| role | CharField(choices=Role) | TextChoices: `admin` / `manager` |
| is_active, is_staff, is_superuser | BooleanField | стандартные Django-флаги |
| date_joined, last_login | DateTimeField | |

`Role` — `TextChoices`:
- `ADMIN = 'admin'` — Администратор
- `MANAGER = 'manager'` — Менеджер

### 4.2. Supplier (приложение `catalog`)
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| name | CharField(200) | |
| inn | CharField(12) | unique, 10/12 цифр |
| contact_email | EmailField | optional |
| phone | CharField(20) | optional |
| created_at, updated_at | DateTimeField | auto |

### 4.3. Product (приложение `catalog`)
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| supplier | FK → Supplier | `on_delete=PROTECT`, `related_name='products'` |
| name | CharField(200) | |
| sku | CharField(50) | unique |
| unit_price | DecimalField(12,2) | min 0 |
| quantity_in_stock | PositiveIntegerField | default=0; меняется только сервисами |
| created_at, updated_at | DateTimeField | auto |

### 4.4. Supply и SupplyItem (приложение `documents`)
**Supply (документ поставки):**
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| supplier | FK → Supplier | PROTECT, related_name='supplies' |
| status | CharField(choices) | `pending` / `received`, default `pending` |
| received_at | DateTimeField | nullable; заполняется автоматически при переходе в `received` |
| created_at, updated_at | DateTimeField | auto |

**SupplyItem (позиция поставки):**
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| supply | FK → Supply | CASCADE, related_name='items' |
| product | FK → Product | PROTECT, related_name='supply_items' |
| quantity | PositiveIntegerField | min 1 |
| unit_price | DecimalField(12,2) | цена на момент поставки (snapshot) |
| UniqueConstraint | (supply, product) | один товар не дублируется в позициях |

### 4.5. Order и OrderItem (приложение `documents`)
**Order (заказ клиента):**
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| customer_name | CharField(200) | |
| status | CharField(choices) | `new` / `assembled` / `shipped`, default `new` |
| shipped_at | DateTimeField | nullable; заполняется автоматически при переходе в `shipped` |
| created_at, updated_at | DateTimeField | auto |

**OrderItem (позиция заказа):**
| Поле | Тип | Особенности |
|---|---|---|
| id | BigAutoField (PK) | |
| order | FK → Order | CASCADE, related_name='items' |
| product | FK → Product | PROTECT, related_name='order_items' |
| quantity | PositiveIntegerField | min 1 |
| unit_price | DecimalField(12,2) | цена на момент создания заказа |
| UniqueConstraint | (order, product) | |

### 4.6. Связи (для ER-диаграммы)
- `Supplier 1—N Product`
- `Supplier 1—N Supply`
- `Supply 1—N SupplyItem`
- `Product 1—N SupplyItem`
- `Order 1—N OrderItem`
- `Product 1—N OrderItem`

`User` логически независим (используется для аутентификации; не привязан к документам в текущей версии).

---

## 5. Бизнес-правила и state-машины

### 5.1. State-машина Supply
```
[*] → pending
pending → received   [триггер: POST /supplies/{id}/receive/]
received → [конечное]
```
**Эффект перехода `pending → received`:** для каждой `SupplyItem` выполняется `Product.quantity_in_stock += quantity`. Атомарно, с `SELECT FOR UPDATE` на строках `Product`.

### 5.2. State-машина Order
```
[*] → new
new → assembled        [триггер: POST /orders/{id}/assemble/]
assembled → shipped    [триггер: POST /orders/{id}/ship/, требуется достаточный остаток]
shipped → [конечное]
```
**Эффект перехода `assembled → shipped`:** для каждой `OrderItem` проверяется `Product.quantity_in_stock >= quantity`. Если у любой позиции остатка не хватает — переход блокируется с HTTP 400 и детальным сообщением. Иначе для каждой `OrderItem` выполняется `Product.quantity_in_stock -= quantity`. Атомарно, с `SELECT FOR UPDATE`.

### 5.3. Инварианты
- `Product.quantity_in_stock >= 0` гарантируется типом `PositiveIntegerField` и проверкой в `services.ship_order` перед декрементом.
- Один товар не может встречаться более одного раза в позициях одного документа (UniqueConstraint).
- `received_at` и `shipped_at` устанавливаются сервисом, не клиентом.
- `status` — read-only через CRUD-эндпоинты (`PATCH /supplies/{id}/`); меняется только через специализированные actions.

---

## 6. REST API контракт

Базовый URL: `/api/`. Все запросы (кроме `/auth/login/` и `/auth/refresh/`) требуют `Authorization: Bearer <access>`.

### 6.1. Аутентификация
| Метод | URL | Тело запроса | Ответ |
|---|---|---|---|
| POST | `/api/auth/login/` | `{username, password}` | `{access, refresh, user: {id, username, email, role, role_display}}` |
| POST | `/api/auth/refresh/` | `{refresh}` | `{access}` |

JWT-payload (access) содержит `user_id`, `role`, `username`, `exp`, `iat`, `jti`.

### 6.2. Пользователи
| Метод | URL | Описание | Доступ |
|---|---|---|---|
| GET | `/api/users/me/` | Текущий пользователь | любой авторизованный |
| GET | `/api/users/` | Список | Admin |
| POST | `/api/users/` | Создать | Admin |
| GET | `/api/users/{id}/` | Получить | Admin |
| PATCH | `/api/users/{id}/` | Изменить | Admin |
| DELETE | `/api/users/{id}/` | Удалить | Admin |

### 6.3. Справочники (Suppliers, Products) — одинаковая структура
| Метод | URL | Описание | Доступ |
|---|---|---|---|
| GET | `/api/suppliers/` | Список с пагинацией и поиском (`?search=...`) | любой авторизованный |
| POST | `/api/suppliers/` | Создать | любой авторизованный (включая Manager) |
| GET | `/api/suppliers/{id}/` | Получить | любой авторизованный |
| PATCH | `/api/suppliers/{id}/` | Изменить | любой авторизованный |
| DELETE | `/api/suppliers/{id}/` | Удалить | только Admin |

Аналогично для `/api/products/`. У `Product` поле `quantity_in_stock` — read-only, нельзя менять PATCH-ом.

### 6.4. Документы (Supplies, Orders)
| Метод | URL | Описание | Доступ |
|---|---|---|---|
| GET | `/api/supplies/` | Список | любой авторизованный |
| POST | `/api/supplies/` | Создать поставку с позициями (nested writable) | любой авторизованный |
| GET | `/api/supplies/{id}/` | Получить | любой авторизованный |
| POST | `/api/supplies/{id}/receive/` | Принять (статусный переход + инкремент остатка) | любой авторизованный |
| GET | `/api/orders/` | Список | любой авторизованный |
| POST | `/api/orders/` | Создать заказ с позициями | любой авторизованный |
| GET | `/api/orders/{id}/` | Получить | любой авторизованный |
| POST | `/api/orders/{id}/assemble/` | Собрать (статусный переход) | любой авторизованный |
| POST | `/api/orders/{id}/ship/` | Отгрузить (статусный переход + декремент остатка) | любой авторизованный |

**Пример POST `/api/supplies/`:**
```json
{
  "supplier": 1,
  "items": [
    {"product": 1, "quantity": 50, "unit_price": "950.00"},
    {"product": 2, "quantity": 30, "unit_price": "320.00"}
  ]
}
```

**Пример POST `/api/orders/`:**
```json
{
  "customer_name": "Кафе Утро",
  "items": [
    {"product": 1, "quantity": 2, "unit_price": "1000.00"}
  ]
}
```

**Формат списка (пагинация DRF):**
```json
{ "count": 10, "next": "...", "previous": null, "results": [...] }
```

### 6.5. Документация API (OpenAPI/Swagger)
- `/api/schema/` — OpenAPI 3 YAML.
- `/api/docs/` — Swagger UI (интерактивный браузер).
- `/api/redoc/` — Redoc UI.

---

## 7. Аутентификация и матрица доступа

### 7.1. Поток аутентификации
1. Клиент шлёт `POST /api/auth/login/`, получает `access` (1 час) и `refresh` (7 дней) + объект `user`.
2. Клиент сохраняет токены в `localStorage`, прикрепляет `Authorization: Bearer <access>` к каждому запросу через axios-интерсептор.
3. При получении 401 axios-интерсептор делает `POST /api/auth/refresh/` с `refresh`, обновляет `access`, повторяет исходный запрос.
4. При неудачном refresh — чистит localStorage и редиректит на `/login`.

### 7.2. Матрица доступа
| Действие | Admin | Manager |
|---|:-:|:-:|
| Список Suppliers, Products | ✓ | ✓ |
| Создание/изменение Supplier, Product | ✓ | ✓ |
| Удаление Supplier, Product | ✓ | ✕ |
| Создание поставок и заказов | ✓ | ✓ |
| Переходы статусов (receive/assemble/ship) | ✓ | ✓ |
| Удаление поставок и заказов | ✓ | ✓ |
| Список и управление пользователями | ✓ | ✕ |
| `/api/users/me/` | ✓ | ✓ |

### 7.3. Реализация (классы permissions)
- `IsAdmin` — только Admin.
- `CatalogPermission` — для Supplier/Product: всем разрешено всё, кроме DELETE (только Admin).
- `UsersPermission` — для UserViewSet: только Admin, кроме action `me` (любой авторизованный).
- На документах — `IsAuthenticated` (по умолчанию).

---

## 8. Структура backend

Корень: `/home/coder/workspace/br_supply-orders/backend/`

```
backend/
├── manage.py
├── requirements.txt
├── pytest.ini
├── Dockerfile
├── .env / .env.example
├── conftest.py                 # pytest-фикстуры (api_client, admin_user, manager_user, supplier, product)
├── config/
│   ├── settings.py             # DRF, JWT, CORS, drf-spectacular, PG via decouple
│   ├── urls.py                 # /admin/, /api/auth/, /api/<router>, /api/docs/, /api/schema/
│   ├── wsgi.py / asgi.py
├── users/
│   ├── models.py               # User (AbstractUser + role TextChoices), Role
│   ├── auth.py                 # TokenWithRoleSerializer/View — расширяет JWT payload
│   ├── permissions.py          # IsAdmin, CatalogPermission, UsersPermission
│   ├── serializers.py          # UserSerializer
│   ├── views.py                # UserViewSet (+ action me)
│   ├── admin.py                # UserAdmin
│   ├── tests.py                # me, login, JWT claims, permissions, seed_demo
│   ├── migrations/0001_initial.py
│   └── management/commands/seed_demo.py
├── catalog/
│   ├── models.py               # Supplier, Product
│   ├── serializers.py          # SupplierSerializer, ProductSerializer
│   ├── views.py                # SupplierViewSet, ProductViewSet
│   ├── admin.py                # SupplierAdmin (search), ProductAdmin (autocomplete supplier)
│   ├── tests.py                # CRUD, ИНН-уникальность, quantity_in_stock readonly, permissions
│   └── migrations/0001_initial.py
└── documents/
    ├── models.py               # Supply + SupplyItem, Order + OrderItem, статусы
    ├── serializers.py          # nested writable (items в payload одного запроса)
    ├── views.py                # SupplyViewSet (action receive), OrderViewSet (action assemble/ship)
    ├── services.py             # receive_supply, assemble_order, ship_order — atomic + select_for_update
    ├── admin.py                # SupplyAdmin/OrderAdmin с TabularInline для позиций
    ├── tests.py                # status transitions, недостача, manager-flow
    └── migrations/0001_initial.py
```

**Ключевая идея сервисного слоя:** ViewSet получает HTTP-запрос → дёргает функцию из `services.py` → функция в одной транзакции выполняет проверки, блокировки, мутации БД. Если возникает бизнес-ошибка — поднимает `ValidationError` (DRF превратит её в HTTP 400 с понятным телом).

---

## 9. Структура frontend

Корень: `/home/coder/workspace/br_supply-orders/frontend/`

```
frontend/
├── package.json / package-lock.json
├── vite.config.ts                # vite + vitest + jsdom
├── tsconfig.* .ts                # TypeScript strict
├── nginx.conf                    # SPA fallback + reverse proxy /api/, /admin/
├── Dockerfile                    # multi-stage: node-build → nginx-runtime
├── .env.development              # VITE_API_URL=http://localhost:8000/api
├── .env.production               # VITE_API_URL=/api (nginx-proxy)
├── .npmrc                        # registry=https://registry.npmjs.org/
├── public/
└── src/
    ├── main.tsx                  # ThemeProvider + CssBaseline + StrictMode
    ├── App.tsx                   # BrowserRouter + AuthProvider + Routes
    ├── App.test.tsx              # routing smoke
    ├── setupTests.ts             # @testing-library/jest-dom/vitest
    ├── api/
    │   ├── client.ts             # axios instance, Bearer интерсептор, 401→refresh→retry
    │   └── types.ts              # User, Role, Supplier, Product, Supply/Item, Order/Item, Paginated<T>
    ├── auth/
    │   ├── AuthContext.tsx       # user + login + logout + localStorage; useAuth() хук
    │   └── AuthContext.test.tsx
    ├── components/
    │   ├── AppLayout.tsx         # AppBar (role chip, logout) + Drawer (нав.) + Outlet
    │   └── ProtectedRoute.tsx    # редирект на /login для неавторизованного
    ├── pages/
    │   ├── HomePage.tsx          # дашборд с плитками
    │   ├── LoginPage.tsx         # форма + login + redirect
    │   ├── LoginPage.test.tsx
    │   ├── suppliers/
    │   │   ├── SuppliersListPage.tsx       # DataGrid + поиск + кнопка «Создать»
    │   │   ├── SuppliersListPage.test.tsx
    │   │   └── SupplierFormPage.tsx        # create/edit + удаление (только Admin)
    │   ├── products/
    │   │   ├── ProductsListPage.tsx        # DataGrid + поиск + остаток-колонка
    │   │   ├── ProductsListPage.test.tsx
    │   │   └── ProductFormPage.tsx         # create/edit + Select поставщика
    │   ├── supplies/
    │   │   ├── SuppliesListPage.tsx        # DataGrid + клик по строке → детали
    │   │   ├── SupplyFormPage.tsx          # форма с динамическими позициями
    │   │   ├── SupplyDetailPage.tsx        # детали + кнопка «Принять»
    │   │   └── SupplyDetailPage.test.tsx
    │   └── orders/
    │       ├── OrdersListPage.tsx          # DataGrid с total_amount
    │       ├── OrderFormPage.tsx           # форма с динамическими позициями + сумма
    │       ├── OrderDetailPage.tsx         # детали + «Собрать»/«Отгрузить»
    │       └── OrderDetailPage.test.tsx
    └── utils/
        └── errors.ts             # extractError() — единообразное сообщение из axios error
```

**Маршруты (`App.tsx`):**
- Публичные: `/login`.
- Защищённые (внутри `<ProtectedRoute>` → `<AppLayout>` → `<Outlet />`):
  - `/`, `/suppliers`, `/suppliers/new`, `/suppliers/:id/edit`,
    `/products`, `/products/new`, `/products/:id/edit`,
    `/supplies`, `/supplies/new`, `/supplies/:id`,
    `/orders`, `/orders/new`, `/orders/:id`.
- `*` → редирект на `/`.

**Состояние:**
- Глобальное (auth) — React Context (`AuthContext`).
- Серверное (списки, детали) — локальный `useState` + `useEffect` на каждой странице (нативный подход без TanStack Query).
- Формы — controlled MUI-компоненты с `useState`. Динамические позиции — массив в state с операциями add/remove/update.

---

## 10. Схема БД (для ER-диаграммы)

```
users_user
  PK id BIGINT
     username VARCHAR(150) UNIQUE
     email VARCHAR(254)
     password VARCHAR(128)
     first_name, last_name VARCHAR
     role VARCHAR(20)            -- 'admin' | 'manager'
     is_active, is_staff, is_superuser BOOL
     date_joined, last_login TIMESTAMP

catalog_supplier
  PK id BIGINT
     name VARCHAR(200)
     inn VARCHAR(12) UNIQUE
     contact_email VARCHAR(254)
     phone VARCHAR(20)
     created_at, updated_at TIMESTAMP

catalog_product
  PK id BIGINT
  FK supplier_id → catalog_supplier(id)   ON DELETE PROTECT
     name VARCHAR(200)
     sku VARCHAR(50) UNIQUE
     unit_price NUMERIC(12,2)
     quantity_in_stock INTEGER             -- >= 0
     created_at, updated_at TIMESTAMP

documents_supply
  PK id BIGINT
  FK supplier_id → catalog_supplier(id)   ON DELETE PROTECT
     status VARCHAR(20)                    -- 'pending' | 'received'
     received_at TIMESTAMP NULL
     created_at, updated_at TIMESTAMP

documents_supplyitem
  PK id BIGINT
  FK supply_id → documents_supply(id)     ON DELETE CASCADE
  FK product_id → catalog_product(id)     ON DELETE PROTECT
     quantity INTEGER                       -- >= 1
     unit_price NUMERIC(12,2)
  UNIQUE (supply_id, product_id)

documents_order
  PK id BIGINT
     customer_name VARCHAR(200)
     status VARCHAR(20)                    -- 'new' | 'assembled' | 'shipped'
     shipped_at TIMESTAMP NULL
     created_at, updated_at TIMESTAMP

documents_orderitem
  PK id BIGINT
  FK order_id → documents_order(id)       ON DELETE CASCADE
  FK product_id → catalog_product(id)     ON DELETE PROTECT
     quantity INTEGER                       -- >= 1
     unit_price NUMERIC(12,2)
  UNIQUE (order_id, product_id)
```

**Кардинальности для ER:**
- `catalog_supplier (1) — (N) catalog_product`
- `catalog_supplier (1) — (N) documents_supply`
- `documents_supply (1) — (N) documents_supplyitem`
- `catalog_product (1) — (N) documents_supplyitem`
- `documents_order (1) — (N) documents_orderitem`
- `catalog_product (1) — (N) documents_orderitem`

---

## 11. Развёртывание

### 11.1. docker-compose.yml — три сервиса
```
postgres   (postgres:16)         5432:5432  volume pgdata
backend    (build ./backend)     8000:8000  depends_on postgres healthy
frontend   (build ./frontend)    80:80      depends_on backend
```

### 11.2. Сетевая модель
- Все три сервиса — в одной compose-сети, обращаются по сервис-имени (`postgres`, `backend`).
- Внешний доступ: `http://localhost/` (frontend через nginx) и `http://localhost:8000/` (backend напрямую).
- nginx во `frontend/nginx.conf` проксирует `/api/`, `/admin/`, `/static/` на `http://backend:8000`.

### 11.3. Переменные окружения backend
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`.
- `CORS_ALLOWED_ORIGINS` (по умолчанию пускает Vite dev `http://localhost:5173`).

### 11.4. Запуск
```
docker compose up -d                                # вся система
docker compose exec backend python manage.py seed_demo   # демо-данные
```

Открыть: http://localhost/ — SPA. Логин `admin` / `admin` (Admin), либо `manager` / `manager` (Manager).

---

## 12. Демо-данные (`manage.py seed_demo`)

Идемпотентная команда (`update_or_create`) создаёт:
- Двух пользователей: `admin/admin` (Admin), `manager/manager` (Manager).
- Трёх поставщиков: «ООО ОптТорг», «ООО ТехноСнаб», «ИП Иванов И.И.».
- 10 товаров с разными артикулами и ценами.
- Две поставки в статусе «Ожидается» (с позициями).
- Два заказа в статусе «Новый» (с позициями).

---

## 13. Тестирование

**Бэкенд (pytest + pytest-django, 34 теста):**
- `users/tests.py`: `/me/`, login с проверкой role в payload и в JWT-claims, неверный пароль = 401, manager не видит /users/, /me/ доступен manager, manager не создаёт user, seed_demo population и идемпотентность.
- `catalog/tests.py`: списки требуют auth, CRUD Supplier и Product, ИНН-уникальность, quantity_in_stock read-only при PATCH, manager создаёт но не удаляет, admin удаляет.
- `documents/tests.py`: nested writable для Supply и Order, валидация пустых items и дублей, receive увеличивает stock, double-receive блокируется, assemble переводит в `assembled`, ship уменьшает stock и заполняет shipped_at, ship падает при недостаче, ship требует статус `assembled`, manager выполняет полный flow.

Запуск: `cd backend && pytest -q`. Тесты используют отдельную тестовую БД (Django создаёт `test_supply_orders`).

**Фронтенд (Vitest + @testing-library/react, 15 тестов):**
- `App.test.tsx`: редирект неавторизованного на /login, layout рендерится для авторизованного.
- `AuthContext.test.tsx`: login сохраняет токены и user, logout чистит state.
- `LoginPage.test.tsx`: форма рендерится, ошибка при неверном пароле, успешный логин сохраняет токены.
- `SuppliersListPage.test.tsx`: рендеринг строк из API, отображение ошибки.
- `ProductsListPage.test.tsx`: рендеринг с supplier_name и quantity_in_stock.
- `SupplyDetailPage.test.tsx`: pending показывает «Принять», вызов `/receive/`.
- `OrderDetailPage.test.tsx`: new показывает «Собрать», assembled — «Отгрузить», вызов `/assemble/`.

Запуск: `cd frontend && npm test`.

---

## 14. План текстовой части курсовой

Типичные главы и какие разделы этого файла куда направить:

1. **Введение** — § 1 (тема и требования).
2. **Анализ предметной области** — описание оптовой торговли, бизнес-процесса «приход → склад → отгрузка», обоснование автоматизации.
3. **Анализ требований** — § 1 (формальные требования) + функциональные требования (CRUD по всем сущностям, статусные переходы, роли).
4. **Архитектура** — § 2 (стек), § 3 (MVT-интерпретация в SPA), § 11 (деплой). Рисунки: компонентная диаграмма + sequence-диаграммы login и status-transition.
5. **Проектирование БД** — § 4 (модель) + § 10 (физическая схема). Рисунок: ER-диаграмма.
6. **Реализация серверной логики** — § 8 (структура) + § 6 (REST-контракт) + § 5 (state-машины). Подсветить сервисный слой и атомарные транзакции.
7. **Реализация слоя БД** — § 4, § 10 (миграции, FK-constraints, UniqueConstraint, ON DELETE PROTECT/CASCADE).
8. **Реализация клиентского представления** — § 9 (структура) + § 6 (контракт). Подсветить ProtectedRoute, axios-интерсепторы, динамические формы позиций.
9. **Безопасность** — § 7 (JWT + матрица ролей).
10. **Тестирование** — § 13.
11. **Развёртывание** — § 11.
12. **Заключение** — итоги (49 тестов, полный CI-цикл, контейнеризация, MVT-паттерн соблюдён).

---

## 15. Что показать на диаграммах

**ER-диаграмма (обязательно):** § 10 — 7 таблиц (включая users_user), все FK с правилами `ON DELETE`, UniqueConstraint, типы полей.

**Компонентная диаграмма архитектуры:**
- Browser
  - React SPA (страницы, AuthContext, axios)
- Web-сервер
  - nginx (статика SPA, reverse proxy /api/, /admin/, /static/)
- Application server
  - Django + DRF (config, urls, views, serializers, services, models, admin)
  - JWT (simplejwt), drf-spectacular
- БД
  - PostgreSQL 16

**Sequence-диаграммы (минимум 3):**
1. **Login flow:** Browser → nginx → Django `/auth/login/` → check password → JWT → response → React stores tokens.
2. **Receive supply:** React → POST `/supplies/{id}/receive/` → ViewSet → services.receive_supply (transaction.atomic, SELECT FOR UPDATE products) → UPDATE Product.quantity_in_stock → UPDATE Supply.status → response → React refresh.
3. **Ship order with insufficient stock:** React → POST `/orders/{id}/ship/` → ViewSet → services.ship_order → проверка stock → ValidationError → 400 → React показывает Alert.

**State-диаграммы:**
- Supply: `[*] → pending → received → [*]`
- Order: `[*] → new → assembled → shipped → [*]`

**Use case (опционально):** актёры Admin и Manager, варианты использования (создать поставщика, принять поставку, отгрузить заказ, удалить поставщика — только Admin).

---

## 16. Полезные ссылки

- Репозиторий: https://github.com/Policarp-wq/br_supply-orders
- Локально: `/home/coder/workspace/br_supply-orders/`
- Запуск: `docker compose up -d` → http://localhost/
- Демо-логины: `admin/admin`, `manager/manager` (после `seed_demo`)
- Swagger: http://localhost/api/docs/
- Django Admin: http://localhost/admin/
