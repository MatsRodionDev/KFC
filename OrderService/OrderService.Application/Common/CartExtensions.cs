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

    public static (List<ErrorViewModel>, List<CartItem>) Validate(
    this Cart cart,
    MenuResponse menuResponse,
    List<ProductResponse> customProducts)
    {
        var errors = new List<ErrorViewModel>();
        var toRemove = new List<CartItem>();

        if (cart.IsEmpty())
        {
            errors.Add(new ErrorViewModel { Message = "Cart is empty" });
            return (errors, toRemove);
        }

        var productsDict = menuResponse.Products.ToDictionary(p => p.Id);
        var customDict = customProducts.ToDictionary(p => p.Id);

        foreach (var item in cart.Items)
        {
            bool isCustom = item.UserId is not null;

            if (isCustom)
            {
                if (!customDict.TryGetValue(item.ProductId, out var customProd))
                {
                    errors.Add(new ErrorViewModel { Message = $"Product with id {item.ProductId} is not available" });
                    toRemove.Add(item);
                    continue;
                }

                if (HasDifferentPrice(
                        item.ItemIngredients.Sum(ii => ii.Price),
                        customProd.ProductIngredients.Sum(ii => ii.Price)))
                {
                    errors.Add(new ErrorViewModel { Message = $"Price for product with id {item.ProductId} has changed" });
                    toRemove.Add(item);
                }
            }
            else
            {
                if (!productsDict.TryGetValue(item.ProductId, out var product))
                {
                    errors.Add(new ErrorViewModel { Message = $"Product with id {item.ProductId} is not available" });
                    toRemove.Add(item);
                    continue;
                }

                if (product.Price != item.Price 
                    || HasDifferentPrice(
                            item.ItemIngredients.Sum(ii => ii.Price),
                            product.ProductIngredients.Sum(ii => ii.Price)))
                {
                    errors.Add(new ErrorViewModel { Message = $"Price for product with id {item.ProductId} has changed" });
                    toRemove.Add(item);
                }
            }
        }

        return (errors, toRemove);
    }
    
    private static bool HasDifferentPrice(decimal a, decimal b) => Math.Abs(a - b) > 0.01m;
    
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