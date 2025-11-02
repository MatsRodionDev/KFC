using System.Text.Json;
using Contracts.Order;
using Contracts.Shared;
using Microsoft.Extensions.Caching.Distributed;

namespace VenueService.BLL.Services;

public interface IOrderStorage
{
    Task<List<Order>> GetCookingAsync(Guid restaurantId);
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

    public async Task<List<Order>> GetCookingAsync(Guid restaurantId)
    {
        return await GetOrdersInternalAsync(GetCookingCacheKey(restaurantId));
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
        }

        await cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(orders, JsonOptions));
    }

    private string GetCookingCacheKey(Guid restaurantId)
    {
        return $"restaurant_orders_{restaurantId}";
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
}