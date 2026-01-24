namespace OrderService.Domain.Models;

public record OrderItemIngredient
{
    public string Name { get; set; } = string.Empty;
    public string? ImageName { get; set; }
    public int Quantity { get; set; }
}