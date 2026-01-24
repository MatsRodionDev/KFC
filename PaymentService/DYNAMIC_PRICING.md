# Динамическое ценообразование для продуктов с ингредиентами

## Обзор

Реализована система динамического ценообразования для продуктов KFC, где цена рассчитывается на основе базовой цены продукта и выбранных ингредиентов.

## Архитектура решения

### Принцип работы

```
Базовая цена продукта + Сумма цен выбранных ингредиентов = Итоговая цена
```

**Пример:**
- Бургер Classic: $5.00 (базовая цена)
- + Сыр: $1.00
- + Бекон: $2.00
- **Итого: $8.00**

## Компоненты системы

### 1. Модели данных

#### `OrderItemRequest`
Запрос на добавление продукта в заказ:
```csharp
public class OrderItemRequest
{
    public string ProductId { get; set; }        // ID продукта
    public int Quantity { get; set; }            // Количество
    public List<string> SelectedIngredientIds { get; set; } // ID выбранных ингредиентов
}
```

#### `CreateCustomOrderRequest`
Запрос на создание заказа с динамическими ценами:
```csharp
public class CreateCustomOrderRequest
{
    public List<OrderItemRequest> Items { get; set; }  // Список товаров
    public string? CustomerEmail { get; set; }         // Email клиента
    public string SuccessUrl { get; set; }             // URL успешной оплаты
    public string CancelUrl { get; set; }              // URL отмены
    public string Currency { get; set; } = "usd"       // Валюта
}
```

#### `ProductWithIngredients`
Модель продукта с доступными ингредиентами:
```csharp
public class ProductWithIngredients
{
    public string ProductId { get; set; }
    public string Name { get; set; }
    public decimal BasePrice { get; set; }
    public List<Ingredient> AvailableIngredients { get; set; }
}
```

#### `Ingredient`
Модель ингредиента:
```csharp
public class Ingredient
{
    public string IngredientId { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

### 2. Сервисы

#### `PriceCalculationService`
Сервис для расчета цен:

**Методы:**
- `CalculateItemPrice()` - рассчитывает цену одного товара
- `CalculateOrderTotal()` - рассчитывает общую сумму заказа
- `BuildItemDescription()` - формирует описание товара с ингредиентами

**Пример расчета:**
```csharp
var basePrice = 5.00m;
var ingredients = new List<Ingredient>
{
    new() { Name = "Сыр", Price = 1.00m },
    new() { Name = "Бекон", Price = 2.00m }
};

var totalPrice = priceCalculator.CalculateItemPrice(basePrice, ingredients);
// Результат: $8.00
```

#### `ProductRepository`
Репозиторий для получения данных о продуктах и ингредиентах.

**Важно:** Текущая реализация использует mock-данные. В production нужно:
1. Интегрироваться с Catalog Service через HTTP API
2. Или использовать прямую БД для получения продуктов

**Интерфейс:**
```csharp
Task<ProductWithIngredients?> GetProductAsync(string productId);
Task<List<Ingredient>> GetIngredientsAsync(List<string> ingredientIds);
```

### 3. Stripe Checkout Service

#### Метод `CreateCheckoutSessionWithCustomPricingAsync`

**Как работает:**

1. **Получение данных о продуктах:**
   ```csharp
   var product = await _productRepository.GetProductAsync(item.ProductId);
   var selectedIngredients = await _productRepository.GetIngredientsAsync(
       item.SelectedIngredientIds);
   ```

2. **Расчет цены:**
   ```csharp
   var itemPrice = _priceCalculator.CalculateItemPrice(
       product.BasePrice,
       selectedIngredients);
   ```

3. **Создание Line Item с PriceData:**
   ```csharp
   new SessionLineItemOptions
   {
       PriceData = new SessionLineItemPriceDataOptions
       {
           Currency = "usd",
           UnitAmount = (long)(itemPrice * 100), // в центах
           ProductData = new SessionLineItemPriceDataProductDataOptions
           {
               Name = product.Name,
               Description = "Бургер Classic (+Сыр, +Бекон)",
               Metadata = { ... }
           }
       },
       Quantity = item.Quantity
   }
   ```

**Ключевое отличие от обычного Checkout:**
- Обычный: использует `Price = "price_xxx"` (фиксированная цена)
- Динамический: использует `PriceData` (цена рассчитывается на лету)

## API Endpoint

### `POST /api/checkout/sessions/custom`

Создает сессию Checkout с динамическим ценообразованием.

**Запрос:**
```json
{
  "items": [
    {
      "productId": "burger_classic",
      "quantity": 1,
      "selectedIngredientIds": ["cheese", "bacon"]
    },
    {
      "productId": "fries_large",
      "quantity": 2,
      "selectedIngredientIds": []
    }
  ],
  "customerEmail": "customer@example.com",
  "successUrl": "https://kfc.com/order/success",
  "cancelUrl": "https://kfc.com/order/cancel",
  "currency": "usd"
}
```

**Ответ:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "status": "open",
  ...
}
```

## Пример использования

### Сценарий: Заказ бургера с ингредиентами

1. **Клиент выбирает:**
   - Бургер Classic (базовая цена: $5.00)
   - Добавляет сыр (+$1.00)
   - Добавляет бекон (+$2.00)

2. **Система рассчитывает:**
   ```
   Базовая цена: $5.00
   Сыр: $1.00
   Бекон: $2.00
   Итого: $8.00
   ```

3. **Создается Checkout Session:**
   - Line Item: "Бургер Classic (+Сыр, +Бекон)" - $8.00
   - Клиент перенаправляется на Stripe Checkout
   - Оплачивает $8.00

4. **После оплаты:**
   - Webhook `checkout.session.completed` получает информацию о заказе
   - В metadata сохраняются ProductId и IngredientIds

## Интеграция с Catalog Service

### Текущая реализация

`ProductRepository` использует mock-данные. Для production нужно:

**Вариант 1: HTTP API**
```csharp
public class ProductRepository : IProductRepository
{
    private readonly HttpClient _httpClient;

    public async Task<ProductWithIngredients?> GetProductAsync(
        string productId, 
        CancellationToken ct)
    {
        var response = await _httpClient.GetFromJsonAsync<ProductWithIngredients>(
            $"/api/products/{productId}",
            ct);
        return response;
    }
}
```

**Вариант 2: Прямая БД**
```csharp
public async Task<ProductWithIngredients?> GetProductAsync(
    string productId, 
    CancellationToken ct)
{
    var product = await _dbContext.Products
        .Include(p => p.AvailableIngredients)
        .FirstOrDefaultAsync(p => p.Id == productId, ct);
    
    return product != null ? MapToModel(product) : null;
}
```

## Преимущества решения

1. **Гибкость:** Цена рассчитывается динамически на основе выбора клиента
2. **Простота:** Используется стандартный Stripe Checkout
3. **Прозрачность:** Клиент видит точную цену с учетом ингредиентов
4. **Масштабируемость:** Легко добавлять новые ингредиенты и продукты

## Ограничения

1. **ProductRepository:** Требует реализации для получения реальных данных
2. **Валидация:** Нет проверки, что ингредиенты доступны для продукта (можно добавить)
3. **Кэширование:** Нет кэширования цен ингредиентов (можно добавить для производительности)

## Следующие шаги

1. Реализовать `ProductRepository` для получения данных из Catalog Service
2. Добавить валидацию доступности ингредиентов для продуктов
3. Добавить кэширование цен ингредиентов
4. Добавить логирование для отслеживания расчетов цен

