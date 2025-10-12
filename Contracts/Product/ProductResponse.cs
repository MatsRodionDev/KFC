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
    public Guid? UserId { get; set; }
    public List<ProductIngredientResponse> ProductIngredients { get; set; } = new();
}

public class ProductIngredientResponse
{
    public Guid IngredientId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public decimal Price { get; set; }
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