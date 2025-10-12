using System.Text.Json.Serialization;

namespace OrderService.Domain.Models;

public class CartItemIngredient
{
    public Guid IngredientId { get; set; }
    public string IngredientName { get; set; }
    public decimal Price { get; set; }
    public int CustomQuantityDelta { get; set; } = 0;
    public int Quantity { get; set; }
    public int MaxQuantity { get; set; }
    public int MinQuantity { get; set; }
    [JsonIgnore]
    public int TotalQuantity => Quantity + CustomQuantityDelta;
    public bool IsBase { get; set; }
}