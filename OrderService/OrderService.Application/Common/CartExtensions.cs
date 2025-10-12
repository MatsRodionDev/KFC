using OrderService.Domain.Models;

namespace OrderService.Application.Common;

public static class CartExtensions
{
    public static bool IsEmpty(this Cart? cart)
    {
        return cart == null 
               || cart.Items.Count == 0;
    }
    
    public static Order ToOrder(this Cart cart, ServiceType serviceType)
    {
        return new Order
        {
            UserId = cart.UserId,
            TotalPrice = cart.TotalPrice,
            Status = OrderStatus.Created,
            ServiceType = serviceType,
            Items = cart.Items
                .Select(i => new OrderItem
                {
                    ProductId = i.ProductId,
                    Name = i.Name,
                    Price = i.TotalPrice,
                    Quantity = i.Quantity,
                    ItemIngredients = i.ItemIngredients
                        .Select(ii => new OrderItemIngredient
                        {
                            Name = ii.IngredientName,
                            Quantity = ii.TotalQuantity
                        })
                        .ToList()
                })
                .ToList()
        };
    }
    
    public static bool EqualToItem(this CartItem? x, CartItem? y)
    {
        if (ReferenceEquals(x, y)) return true;
        if (x is null || y is null) return false;
        if (x.GetType() != y.GetType()) return false;
        
        var isEqual = x.ProductId == y.ProductId 
               && x.UserId == y.UserId;

        if (!isEqual || x.ItemIngredients.Count != y.ItemIngredients.Count)
        {
            return false;
        }
        
        var yIngredientsDictionary = y.ItemIngredients
            .GroupBy(i => i.IngredientId)
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var ingredient in x.ItemIngredients)
        {
            if (!yIngredientsDictionary.TryGetValue(ingredient.IngredientId, out var yIngredient))
                return false;

            if (!ingredient.EqualToIngredient(yIngredient))
                return false;
        }

        return true;
    }

    private static bool EqualToIngredient(this CartItemIngredient? x, CartItemIngredient? y)
    {
        if (ReferenceEquals(x, y)) return true;
        if (x is null || y is null) return false;
        if (x.GetType() != y.GetType()) return false;
        
        return x.IngredientId == y.IngredientId
            && x.Quantity == y.Quantity
            && x.CustomQuantityDelta == y.CustomQuantityDelta
            && x.IsBase == y.IsBase;
    }
}