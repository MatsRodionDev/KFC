using Shop.Domain.ValueObjects;

namespace Shop.Application.Common.Dtos
{
    public record AddIngredientToProductDto(Guid IngredientId, Quantity Quantity)
}
