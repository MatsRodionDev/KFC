using System.ComponentModel;
using ChatClient.API.Clients;
using ChatClient.API.Dtos;
using Contracts.Cache;
using Contracts.Product;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace ChatClient.API.Tools;

public class ProductTools(IServiceProvider provider)
{
    [Description("""
                 Ищет продукты в каталоге по смысловому совпадению с текстом описания пользователя.
                 Используется, когда пользователь упоминает название или тип блюда (например: "две пиццы маргарита" или "роллы с лососем").
                 Возвращает список коротких сведений о найденных продуктах (productId, name, shortDescription), отсортированных по релевантности.
                 """)]
    public async Task<List<ProductShortInfo>> GetProductsByDescription(
        [Description("Естественное текстовое описание продукта из пользовательского запроса.")] string description)
    {
        using var scope =  provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var embeddingService = scope.ServiceProvider.GetRequiredService<EmbeddingService>();
        
        var embedding = await embeddingService.GenerateAsync(description);
        var vector = new Vector(embedding);
        
        var chunks = await context.Chunks
            .Where(c => c.Embedding1024.CosineDistance(vector) < 0.4)
            .OrderBy(c => c.Embedding1024.CosineDistance(vector))
            .ToListAsync();
        
        return chunks.Select(c => c.ProductInfo).ToList();
    }

    [Description("""
                 Возвращает подробную информацию о продукте по его уникальному идентификатору.
                 Используется, когда нужно получить базовый список ингредиентов и ограничения по количеству перед модификацией состава.
                 Результат включает полные данные продукта: название, описание, цену, и список ингредиентов (с базовыми и максимальными количествами).
                 """)]
    public async Task<ProductDto?> GetProductById(
        [Description("Уникальный идентификатор продукта (productId), ранее найденный через get_products_by_description).")] Guid productId)
    {
        using var scope =  provider.CreateScope();
        var catalogClient = scope.ServiceProvider.GetRequiredService<ICatalogClient>();
        var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();
        
        var product = await cacheService.GetOrAddAsync(productId.ToString(), GetProduct);

        return product?.ToProductDto();
        
        async Task<ProductResponse?> GetProduct() => await catalogClient.GetCartItem(productId);
    }

    [Description("""
                 Проверяет запрос пользователя на изменение ингредиентов для указанного продукта.
                 Используется, когда пользователь явно упомянул добавление, удаление или изменение порций ингредиентов и УКАЗАЛ НАЗВАНИЕ ИНГРЕДИЕНТА!!! (например: "без лука", "добавить ветчину", "дополнительный сыр").
                 Функция проверяет корректность запрошенного количества относительно базы (мин/макс) и возвращает массив корректированных ингредиентов для включения в поле `customIngredients[]`.
                 """)]
    public async Task<List<CustomIngredient>?> ValidateIngredientQuantities(
        [Description("Идентификатор продукта, к которому применяются изменения ингредиентов.")] Guid productId,
        [Description("Массив ингредиентов, указанных пользователем с новыми количествами для каждого.")] List<IngredientQuantityDto> ingredientQuantities)
    {
        using var scope = provider.CreateScope();
        var catalogClient = scope.ServiceProvider.GetRequiredService<ICatalogClient>();
        var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();
        
        var product = await cacheService.GetOrAddAsync(productId.ToString(), GetProduct);

        if (product is null)
        {
            return null;
        }
        
        List<CustomIngredient> customIngredients = [];

        var ingredients = product.ProductIngredients.ToDictionary(i => i.IngredientId);
        foreach (var ingredientQuantity in ingredientQuantities)
        {
            if (!ingredients.TryGetValue(ingredientQuantity.IngredientId, out var ingredient))
            {
                continue;
            }

            if (ingredient.IsBase)
            {
                customIngredients.Add(new CustomIngredient(
                    ingredient.IngredientName,
                    ingredient.Quantity.Value,
                    0,
                    $"Количество базового ингредиента {ingredient.IngredientName} не может быть изменено"));
                
                continue;
            }

            if (ingredientQuantity.Quantity == ingredient.Quantity.Value)
            {
                continue;
            }

            if (ingredient.MaxQuantity.Value < ingredientQuantity.Quantity)
            {
                customIngredients.Add(new CustomIngredient(
                    ingredient.IngredientName,
                    ingredient.MaxQuantity.Value,
                    ingredient.MaxQuantity.Value - ingredient.Quantity.Value,
                    $"Максимальное количество {ingredient.IngredientName} не больше {ingredient.MaxQuantity.Value}"));
                
                continue;
            }
            
            if (ingredient.MinQuantity.Value > ingredientQuantity.Quantity)
            {
                customIngredients.Add(new CustomIngredient(
                    ingredient.IngredientName,
                    ingredient.MinQuantity.Value,
                    ingredient.MinQuantity.Value - ingredient.Quantity.Value,
                    $"Минимальное количество {ingredient.IngredientName} не меньше {ingredient.MinQuantity.Value}"));
                
                continue;
            }

            customIngredients.Add(new CustomIngredient(
                ingredient.IngredientName,
                ingredientQuantity.Quantity,
                ingredientQuantity.Quantity - ingredient.Quantity.Value,
                null));
        }
        
        return customIngredients;
        
        async Task<ProductResponse?> GetProduct() => await catalogClient.GetCartItem(productId);
    }
}

public record IngredientQuantityDto(Guid IngredientId, int Quantity);
