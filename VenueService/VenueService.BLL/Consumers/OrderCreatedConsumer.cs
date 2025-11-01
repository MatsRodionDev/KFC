using System.Collections.Concurrent;
using Contracts.Events;
using Contracts.Order;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using VenueService.BLL.Services;
using VenueService.DAL;
using VenueService.DAL.Entities;

namespace VenueService.BLL.Consumers;

public class OrderCreatedConsumer(
    VenueDbContext  dbContext,
    INotifyOrderService notifyOrderService,
    IMemoryCache memoryCache,
    IRestaurantOrderService restaurantOrderService,
    IRestaurantService restaurantService,
    ILogger<OrderCreatedConsumer> logger) : IConsumer<OrderCreatedEvent>
{
    private const int MaxBufferSize = 1000;
    
    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var order = context.Message.Order;
        
        logger.LogInformation("Received OrderCreatedEvent for OrderId: {OrderId}, UserId: {UserId}", 
            order.Id, order.UserId);
        
        var coordinates = order.Delivery.Coordinates;

        RestaurantEntity? restaurant = (coordinates is not null) switch
        {
            true => await dbContext.Restaurants
                .Where(r => r.IsActive)
                .OrderBy(r
                    => r.Location.Distance(new Point(coordinates.Latitude, coordinates.Longitude)))
                .FirstOrDefaultAsync(),

            false => await dbContext.Restaurants
                .Where(r => r.IsActive)
                .OrderBy(r => EF.Functions.Random())
                .FirstOrDefaultAsync()
        };
        
        if (restaurant is null)
        {
            await AddToBufferAsync(order);
            return;
        }

        await AddToRestaurantQueueAsync(order, restaurant.Id);
        
        await notifyOrderService.Notify(order, restaurant.Id);
    }
    
    private async Task AddToBufferAsync(Order order)
    {
        const string cacheKey = "orders_buffer";
        using var locker = await Locks<string>.Wait(cacheKey);

        var queue = memoryCache.GetOrCreate<ConcurrentQueue<Order>>(cacheKey, _ => new ConcurrentQueue<Order>())!;

        if (queue.Count >= MaxBufferSize)
        {
            queue.TryDequeue(out _);
        }
        
        queue.Enqueue(order);
    }
    
    private async Task AddToRestaurantQueueAsync(Order order, Guid restaurantId)
    {
        var cacheKey = $"restaurant_orders_{restaurantId}";
        using var locker = await Locks<string>.Wait(cacheKey);

        var queue = memoryCache.GetOrCreate<ConcurrentQueue<Order>>(cacheKey, _ => new ConcurrentQueue<Order>());
        queue!.Enqueue(order);
    }
}

public static class Locks<T> 
    where T : notnull
{
    private static readonly ConcurrentDictionary<T, SemaphoreSlim> _locks = new();

    public static async Task<AsyncLock> Wait(T key)
    {
        SemaphoreSlim? semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();
        return new AsyncLock(semaphore);
    }

    public class AsyncLock : IDisposable
    {
        private readonly SemaphoreSlim _semaphoreSlim;

        public AsyncLock(SemaphoreSlim semaphoreSlim)
        {
            _semaphoreSlim = semaphoreSlim;
        }

        public void Dispose()
        {
            _semaphoreSlim.Release();
        }
    }
}