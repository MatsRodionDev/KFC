using System.Text;
using System.Text.Json;

namespace Contracts.Product;

public class ProductResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public decimal IngredientsPrice { get; set; }
    public ProductCategory ProductCategory { get; set; }
    public NutritionResponse Nutrition { get; set; } = default!;
    public string? ImageName { get; set; }
    public Guid? UserId { get; set; }
    public List<ProductIngredientResponse> ProductIngredients { get; set; } = new();
}

public class ProductIngredientResponse
{
    public Guid IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageName { get; set; }
    public QuantityResponse Quantity { get; set; }
    public QuantityResponse MinQuantity { get; set; }
    public QuantityResponse MaxQuantity { get; set; }
    public bool IsBase { get; set; }
    public NutritionResponse TotalNutrition { get; set; } = default!;
}
public class NutritionResponse
{
    public int Calories { get; set; }
    public int Weight { get; set; }
}

public class QuantityResponse
{
    public int Value { get; set; }
}

public enum ProductCategory
{
    Pizza,
    Burger,
    Basket
}

public static class ProductResponseExtensions
{
    public static ProductDto ToProductDto(this ProductResponse product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Category = product.ProductCategory.ToString(),
            Description = product.Description,
            Ingredients = product.ProductIngredients.Select(ing => new ProductIngredientDto
            {
                IngredientId =  ing.IngredientId,
                Name = ing.IngredientName,
                Price = ing.Price,
                Quantity = ing.Quantity.Value,
                MinQuantity = ing.MinQuantity.Value,
                MaxQuantity = ing.MaxQuantity.Value
            }).ToList()
        };
    }
}

public class ProductDto
{
    public Guid Id { get; set; } 
    public string Name { get; set; }    
    public string Category { get; set; }  
    public string Description { get; set; }
    public List<ProductIngredientDto> Ingredients { get; set; }
}

public class ProductIngredientDto
{
    public Guid IngredientId { get; set; }
    public string Name { get; set; }    
    public decimal Price { get; set; }    
    public int Quantity { get; set; }    
    public int MinQuantity { get; set; } 
    public int MaxQuantity { get; set; }  
}