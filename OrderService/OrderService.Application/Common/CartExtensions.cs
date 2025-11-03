using System.Runtime.InteropServices.JavaScript;
using Contracts.Middlewares;
using Contracts.Product;
using OrderService.Application.Common.Clients;
using OrderService.Domain.Models;

namespace OrderService.Application.Common;

public static class CartExtensions
{
    public static bool IsEmpty(this Cart? cart)
    {
        return cart == null 
               || cart.Items.Count == 0;
    }

    public static void Clear(this Cart cart)
    {
        cart.Items.Clear();
        cart.Delivery = new Delivery();
    }

    public static List<ErrorViewModel> Validate(this Cart cart, MenuResponse menuResponse)
    {
        var products = menuResponse.Products;
        List<ErrorViewModel> errors = [];
        
        if (cart.IsEmpty())
        {
            var error = new ErrorViewModel { Message = "Cart is empty" };
            errors.Add(error);
            return errors;
        }

        var productsDictionary = products.ToDictionary(p => p.Id);
        
        foreach (var item in cart.Items.ToList())
        {
            if (item.UserId is not null)
            {
                continue;
            }
            
            if (!productsDictionary.TryGetValue(item.ProductId, out var product))
            {
                cart.Items.Remove(item);
                var error = new ErrorViewModel { Message = $"Product with id {item.ProductId} doesnt available" };
                errors.Add(error);
            }
            
            if (product?.Price != item.Price
                || item.ItemIngredients.Sum(ii => ii.Price) != item.ItemIngredients.Sum(ii => ii.Price))
            {
                cart.Items.Remove(item);
                var error = new ErrorViewModel { Message = $"Product's with id {item.ProductId} price was changed" };
                errors.Add(error);
            }
        }
        
        return errors;
    }
    
    public static Order ToOrder(this Cart cart)
    {
        return new Order
        {
            UserId = cart.UserId,
            TotalPrice = cart.TotalPrice,
            Status = OrderStatus.Created,
            Delivery = new Delivery
            {
                ServiceType = cart.Delivery.ServiceType,
                Address = cart.Delivery.Address,
                Coordinates = cart.Delivery.Coordinates is null 
                    ? null 
                    : new Coordinates
                    {
                        Latitude = cart.Delivery.Coordinates.Latitude,
                        Longitude = cart.Delivery.Coordinates.Longitude
                    }
            },
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