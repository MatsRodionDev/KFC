namespace Catalog.Domain.Services;

public record IngredientSnapshot
{
    public Guid IngredientId { get; set; }
    public int Quantity { get; set; }
    public int MinQuantity { get; set; }
    public int MaxQuantity { get; set; }
}