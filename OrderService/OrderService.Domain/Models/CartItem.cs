using System.Text.Json.Serialization;

namespace OrderService.Domain.Models;

public class CartItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CartId { get; set; }
    public Guid? UserId { get; set; }
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public int Quantity { get; set; }
    [JsonIgnore]
    public decimal TotalPrice => 
        (Price != null 
            ? Price.Value + ItemIngredients.Sum(i => i.CustomQuantityDelta * Price).Value
            : ItemIngredients.Sum(i => (i.CustomQuantityDelta + i.Quantity) * i.Price)) * Quantity;

    public List<CartItemIngredient> ItemIngredients { get; set; } = [];
}