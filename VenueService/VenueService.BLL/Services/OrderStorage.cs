using System.Text.Json;
using Contracts.Order;
using Contracts.Shared;
using Microsoft.Extensions.Caching.Distributed;

namespace VenueService.BLL.Services;

public interface IOrderStorage
{
    Task<List<Order>> GetCookingsAsync(Guid restaurantId);
    Task<Order?> GetCookingAsync(Guid restaurantId, Guid orderId);
    Task<Order?> SetCookingReadyAsync(Guid restaurantId, Guid orderId);
    Task AddCookingAsync(Order order, Guid restaurantId);
    Task RemoveCookingAsync(Guid orderId, Guid restaurantId);
}

public class OrderStorage(IDistributedCache cache) : IOrderStorage
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public async Task<List<Order>> GetCookingsAsync(Guid restaurantId)
    {
        return await GetOrdersInternalAsync(GetCookingCacheKey(restaurantId));
    }
    
    public async Task<Order?> GetCookingAsync(Guid restaurantId, Guid orderId)
    {
        return (await GetOrdersInternalAsync(GetCookingCacheKey(restaurantId))).FirstOrDefault(x => x.Id == orderId);
    }
    
    public async Task<Order?> SetCookingReadyAsync(Guid restaurantId, Guid orderId)
    {
        var cacheKey = GetCookingCacheKey(restaurantId);
        using var locker = await Locks<string>.Wait(cacheKey);
        
        var orders = await GetOrdersInternalAsync(GetCookingCacheKey(restaurantId));
        
        var order = orders.FirstOrDefault(x => x.Id == orderId);

        if (order == null)
        {
            throw new Exception("Order not found");
        }
        
        if (order.Status == OrderStatus.Ready)
            throw new Exception("Order ready");
        
        order.Status = OrderStatus.Ready;
        await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(orders, JsonOptions));
        
        return order;
    }

    public async Task AddCookingAsync(Order order, Guid restaurantId)
    {
        var cacheKey = GetCookingCacheKey(restaurantId);
        using var locker = await Locks<string>.Wait(cacheKey);

        var orders = await GetOrdersInternalAsync(cacheKey);

        if (orders.All(o => o.Id != order.Id))
        {
            orders.Add(order);
            await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(orders, JsonOptions));
        }
    }

    public async Task RemoveCookingAsync(Guid orderId, Guid restaurantId)
    {
        var cacheKey = GetCookingCacheKey(restaurantId);
        using var locker = await Locks<string>.Wait(cacheKey);

        var orders = await GetOrdersInternalAsync(cacheKey);

        var order = orders.FirstOrDefault(o => o.Id == orderId);
        if (order is not null)
        {
            orders.Remove(order);
            await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(orders, JsonOptions));
        }
    }

    private async Task<List<Order>> GetOrdersInternalAsync(string cacheKey)
    {
        var json = await cache.GetStringAsync(cacheKey);
        
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }
            
        try
        {
            return JsonSerializer.Deserialize<List<Order>>(json, JsonOptions) ?? new List<Order>();
        }
        catch
        {
            return [];
        }
    }
    
    private static string GetCookingCacheKey(Guid restaurantId)
    {
        return $"restaurant_orders_{restaurantId}";
    }
}
