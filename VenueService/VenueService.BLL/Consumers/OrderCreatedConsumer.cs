using System.Collections.Concurrent;
using Contracts.Broker.EventBus;
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

// вынести логику в handler

public class OrderCreatedConsumer(
    VenueDbContext  dbContext,
    INotifyOrderService notifyOrderService,
    IOrderStorage orderStorge,
    IEventBus eventBus,
    ILogger<OrderCreatedConsumer> logger) : IConsumer<SendOrderToVduEvent>
{
    public async Task Consume(ConsumeContext<SendOrderToVduEvent> context)
    {
        var order = context.Message.Order;
        
        logger.LogInformation("Received OrderCreatedEvent for OrderId: {OrderId}, UserId: {UserId}", 
            order.Id, order.UserId);
        
        var storeInfo = order.Delivery.StoreAddressInfo;

        if (storeInfo is null)
        {
            return;
        }

        var restaurant = await dbContext.Restaurants
            .FirstOrDefaultAsync(r => r.Id == storeInfo.StoreId);

        if (restaurant is  null)
        {
            throw new NullReferenceException("Restaurant is null");
        }
        
        await orderStorge.AddCookingAsync(order, restaurant.Id);
        await notifyOrderService.Notify(order, restaurant.Id);
        
        await eventBus.PublishAsync(new OrderEvent(Guid.NewGuid(), order.Id, EventType.OrderCooking, DateTime.UtcNow));
    }
}