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

// вынести логику в handler

public class OrderCreatedConsumer(
    VenueDbContext  dbContext,
    INotifyOrderService notifyOrderService,
    IOrderStorage orderStorge,
    IRestaurantOrderService restaurantOrderService,
    IRestaurantService restaurantService,
    ILogger<OrderCreatedConsumer> logger) : IConsumer<OrderCreatedEvent>
{
    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var order = context.Message.Order;
        
        logger.LogInformation("Received OrderCreatedEvent for OrderId: {OrderId}, UserId: {UserId}", 
            order.Id, order.UserId);
        
        var coordinates = order.Delivery.Coordinates;

        var restaurant = (coordinates is not null) switch
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

        if (restaurant is  null)
        {
            // надо подумать как обрабатывать
            throw new NullReferenceException("Restaurant is null");
        }
        
        await orderStorge.AddCookingAsync(order, restaurant.Id);
        await notifyOrderService.Notify(order, restaurant.Id);
    }
}