using Contracts.Product;
using OrderService.Domain.Models;

namespace OrderService.Application.Common.Mappers;

public static class ProductToCartMapper
{
    public static CartItem ToCartItem(this ProductResponse product, Guid? userId = null)
    {
        if (product == null)
            throw new ArgumentNullException(nameof(product));

        var cartItem = new CartItem
        {
            UserId = product.UserId,
            ProductId = product.Id,
            Name = product.Name,
            Price = product.Price,
            ImageName = product.ImageName,
            ItemIngredients = product.ProductIngredients.Select(ToCartIngredient).ToList()
        };

        return cartItem;
    }

    private static CartItemIngredient ToCartIngredient(ProductIngredientResponse ingredient)
    {
        return new CartItemIngredient
        {
            IngredientId = ingredient.IngredientId,
            IngredientName = ingredient.IngredientName,
            Price = ingredient.Price,
            ImageName = ingredient.ImageName,
            Quantity = ingredient.Quantity.Value,
            MinQuantity = ingredient.MinQuantity.Value,
            MaxQuantity = ingredient.MaxQuantity.Value,
            IsBase = ingredient.IsBase,
            CustomQuantityDelta = 0 
        };
    }
}