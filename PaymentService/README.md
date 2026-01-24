# PaymentService

Микросервис для работы с платежной системой Stripe.

## Описание

PaymentService предоставляет REST API для интеграции с Stripe, включая:
- Управление продуктами и ценами
- Создание и управление платежами (PaymentIntent)
- Управление клиентами (Customers)
- Создание сессий Stripe Checkout
- Обработка webhook'ов от Stripe

## Технологии

- .NET 9.0
- ASP.NET Core Web API
- Stripe.net 50.2.0-beta.1
- Temporalio 1.9.0 (Workflow Orchestration)
- Swashbuckle.AspNetCore (Swagger)

## Структура проекта

```
PaymentService.API/
├── Configuration/          # Конфигурация (StripeOptions)
├── Controllers/           # REST API контроллеры
│   ├── PaymentsController.cs
│   ├── CustomersController.cs
│   ├── ProductsController.cs
│   ├── CheckoutController.cs
│   └── WebhooksController.cs
├── Models/                # DTOs для запросов/ответов
├── Services/              # Бизнес-логика и интеграция со Stripe
│   ├── IStripeCustomerService.cs
│   ├── StripeCustomerService.cs
│   ├── IStripeCheckoutService.cs
│   ├── StripeCheckoutService.cs
│   ├── IStripeWebhookService.cs
│   └── StripeWebhookService.cs
├── Worlflows/            # Temporal Workflows
│   └── PaymentWorkflow.cs
├── Handlers/             # Command handlers
│   ├── CreateSessionHandler.cs
│   └── ProcessWebhookEventHandler.cs
└── Middleware/           # Middleware для обработки ошибок
    └── ExceptionHandlingMiddleware.cs
```

## Конфигурация

Настройки Stripe находятся в `appsettings.json`:

```json
{
  "Stripe": {
    "ApiKey": "sk_test_...",
    "WebhookSecret": "whsec_...",
    "Currency": "usd"
  },
  "Temporal": {
    "Address": "localhost:7233",
    "Namespace": "default",
    "TaskQueue": "payment-workflow-task-queue"
  }
}
```

### Переменные окружения

Для production рекомендуется использовать переменные окружения:
- `Stripe:ApiKey` - секретный ключ Stripe API
- `Stripe:WebhookSecret` - секрет для верификации webhook'ов
- `Stripe:Currency` - валюта по умолчанию (по умолчанию "usd")
- `Temporal:Address` - адрес Temporal сервера (по умолчанию "localhost:7233")
- `Temporal:Namespace` - namespace Temporal (по умолчанию "default")
- `Temporal:TaskQueue` - очередь задач для workflows (по умолчанию "payment-workflow-task-queue")

## API Endpoints

### Products (Продукты)

- `GET /api/products` - Получить список продуктов
- `GET /api/products/{productId}` - Получить продукт по ID
- `PUT /api/products/{productId}` - Обновить продукт
- `POST /api/products/{productId}/archive` - Архивировать продукт
- `POST /api/products/{productId}/prices` - Создать цену для продукта

### Payments (Платежи)

- `POST /api/payments/intents` - Создать PaymentIntent
- `GET /api/payments/intents/{paymentIntentId}` - Получить PaymentIntent
- `POST /api/payments/intents/{paymentIntentId}/confirm` - Подтвердить платеж
- `POST /api/payments/intents/{paymentIntentId}/cancel` - Отменить платеж

### Customers (Клиенты)

- `POST /api/customers` - Создать клиента
- `GET /api/customers/{customerId}` - Получить клиента по ID
- `PUT /api/customers/{customerId}` - Обновить клиента
- `DELETE /api/customers/{customerId}` - Удалить клиента
- `GET /api/customers` - Получить список клиентов

### Checkout (Stripe Checkout)

- `POST /api/checkout/sessions` - Создать сессию Checkout
- `GET /api/checkout/sessions/{sessionId}` - Получить сессию Checkout
- `POST /api/checkout/sessions/{sessionId}/expire` - Истечь сессию Checkout

### Webhooks (Вебхуки)

- `POST /api/webhooks` - Обработка webhook'ов от Stripe

## Примеры использования

### Создание PaymentIntent

```http
POST /api/payments/intents
Content-Type: application/json

{
  "amount": 2000,
  "currency": "usd",
  "description": "Payment for order #123",
  "metadata": {
    "orderId": "123"
  }
}
```

### Создание клиента

```http
POST /api/customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

### Создание Checkout Session

```http
POST /api/checkout/sessions
Content-Type: application/json

{
  "lineItems": [
    {
      "priceId": "price_1234567890",
      "quantity": 1
    }
  ],
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "mode": "payment"
}
```

## Webhook Events

Сервис обрабатывает следующие события от Stripe:
- `payment_intent.succeeded` - платеж успешно выполнен
- `payment_intent.payment_failed` - платеж не удался
- `checkout.session.completed` - сессия Checkout завершена

Для настройки webhook'ов в Stripe Dashboard:
1. Перейдите в Developers → Webhooks
2. Добавьте endpoint: `https://your-domain.com/api/webhooks`
3. Выберите события для отправки

## Запуск проекта

### Предварительные требования

1. **Temporal Server** должен быть запущен:
   ```bash
   # Используя Docker
   docker run -p 7233:7233 temporalio/auto-setup:latest
   
   # Или используя Temporal CLI
   temporal server start-dev
   ```

2. **Stripe CLI** (для локальной разработки с webhook'ами):
   ```bash
   stripe listen --forward-to http://localhost:5000/api/webhooks
   ```

### Запуск

```bash
dotnet restore
dotnet build
dotnet run --project PaymentService.API
```

Swagger UI доступен по адресу: `https://localhost:7043/swagger` (в режиме Development)

### Проверка подключения к Temporal

При запуске приложения в логах должно появиться:
```
Connecting to Temporal server at localhost:7233, Namespace: default
Successfully connected to Temporal server
```

Если Temporal сервер не запущен, приложение выдаст ошибку при старте.

## Принципы разработки

- **SOLID** - соблюдение принципов SOLID
- **DRY** - избегание дублирования кода
- **KISS** - простота реализации
- **REST** - следование принципам REST API
- Использование async/await для всех операций
- Передача CancellationToken во все асинхронные методы
- Обработка ошибок через middleware
- Использование Options pattern для конфигурации

## Зависимости

- `Stripe.net` - официальная библиотека для работы со Stripe API
- `Temporalio` - библиотека для работы с Temporal (workflow orchestration)
- `Swashbuckle.AspNetCore` - генерация Swagger документации
- `Contracts` - общие контракты и события (внешний проект)

## Temporal Workflows

Сервис использует Temporal для оркестрации процессов оплаты:

- **PaymentWorkflow** - workflow для обработки платежей через Stripe Checkout
  - Ожидает события от Stripe webhook'ов
  - Обрабатывает успешные и неуспешные платежи
  - Управляет жизненным циклом платежной сессии

### Temporal Worker

Temporal Worker автоматически запускается при старте приложения как фоновый сервис (`TemporalWorkerService`). Worker:

- Подключается к Temporal серверу при старте
- Регистрирует `PaymentWorkflow` для выполнения
- Слушает задачи из очереди `payment-workflow-task-queue`
- Автоматически обрабатывает запущенные workflows

Worker работает в фоновом режиме и не блокирует основной поток приложения.

**Логи при запуске:**
```
Starting Temporal Worker for TaskQueue: payment-workflow-task-queue, Namespace: default
Temporal Worker started successfully. Listening for workflows on queue: payment-workflow-task-queue
```

Подробнее о настройке Temporal см. [Temporal Documentation](https://docs.temporal.io/)

