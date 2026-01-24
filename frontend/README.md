# KFC Frontend

React приложение с TypeScript для работы с сервисами Catalog и OrderService.

## Технологии

- React 18
- TypeScript
- React Router
- Axios
- Vite

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## Структура проекта

```
frontend/
├── src/
│   ├── components/      # Переиспользуемые компоненты
│   ├── pages/           # Страницы приложения
│   ├── hooks/           # Кастомные хуки
│   ├── services/        # API сервисы
│   ├── types/           # TypeScript типы
│   └── styles/          # Глобальные стили
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API Endpoints

### Catalog Service (http://localhost:5079)
- `GET /api/menus` - Получить меню
- `GET /api/products/:id` - Получить продукт
- `GET /api/products/custom/:userId` - Получить кастомные продукты
- `POST /api/products` - Создать продукт
- `POST /api/products/custom` - Создать кастомный продукт
- `GET /api/ingredients/:id` - Получить ингредиент

### Order Service (http://localhost:5046)
- `GET /api/carts/:userId` - Получить корзину
- `POST /api/carts/items` - Добавить товар в корзину
- `POST /api/carts/address` - Установить адрес доставки
- `POST /api/orders` - Создать заказ

## Особенности

- Современная архитектура с разделением на компоненты, страницы и сервисы
- Типизация TypeScript для безопасности типов
- Кастомные хуки для работы с API
- Адаптивный дизайн в стиле Dodo/Food.by
- Готовность к разделению на роли (пока не реализовано)

## TODO

- [ ] Реализовать аутентификацию и получение реального UserId
- [ ] Добавить загрузку ингредиентов для создания продуктов
- [ ] Реализовать историю заказов
- [ ] Добавить обработку ошибок и уведомления
- [ ] Реализовать разделение на роли (админ, пользователь)







