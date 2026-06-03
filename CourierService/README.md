# CourierService

API для курьерского приложения: регистрация, вход, статус «на линии», активные заказы и история доставок (PostgreSQL).

## Запуск

Требуется **.NET 9 SDK** (см. `global.json` в этой папке).

1. PostgreSQL на порту **5433** (как в `docker-compose.full.yml`).
2. База создаётся автоматически при первом запуске (`MigrateAsync`).

**Rider / Visual Studio:** откройте `CourierService.sln` (не папку как Directory-Based Solution).  
Build configuration: **Debug | Any CPU**, startup project: **CourierService.API**, профиль **http**.

```powershell
cd CourierService
dotnet build CourierService.sln
dotnet run --project CourierService.API --launch-profile http
```

Слушает **http://0.0.0.0:5055**.

## Переменные

`appsettings.json` → `ConnectionStrings:CourierDb`  
По умолчанию: `Host=localhost;Port=5433;Database=courierservice;Username=postgres;Password=postgres`

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/couriers/register` | Регистрация |
| POST | `/api/couriers/login` | Вход |
| GET | `/api/couriers/{id}` | Профиль |
| PATCH | `/api/couriers/{id}/online` | Онлайн/офлайн |
| GET | `/api/couriers/{id}/orders?scope=active\|history` | Заказы |
| POST | `/api/couriers/{id}/orders` | Сохранить/обновить снимок заказа |
| PATCH | `/api/couriers/{id}/orders/{orderId}` | Сменить статус |

В `courier-app` укажите `EXPO_PUBLIC_COURIER_API_URL=http://<IP-ПК>:5055`.
