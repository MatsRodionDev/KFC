using Contracts.Events;
using MassTransit;
using Microsoft.Extensions.Logging;
using VenueService.BLL.Models;
using VenueService.BLL.Services;

namespace VenueService.BLL.Consumers;

public class OrderCreatedConsumer(
    IRestaurantOrderService restaurantOrderService,
    IRestaurantService restaurantService,
    ILogger<OrderCreatedConsumer> logger) : IConsumer<OrderCreatedEvent>
{
    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var order = context.Message.Order;
        
        logger.LogInformation("Received OrderCreatedEvent for OrderId: {OrderId}, UserId: {UserId}", 
            order.Id, order.UserId);

        // Find the nearest restaurant for the order
        // For now, we'll assign to the first active restaurant
        // This logic can be enhanced based on location, capacity, etc.
        var restaurants = await restaurantService.GetAllAsync(r => r.IsActive);
        
        if (restaurants.Count == 0)
        {
            logger.LogWarning("No active restaurants found to assign order {OrderId}", order.Id);
            return;
        }

        var selectedRestaurant = restaurants.FirstOrDefault();
        
        var restaurantOrder = new RestaurantOrderModel
        {
            OrderId = order.Id,
            RestaurantId = selectedRestaurant.Id,
            UserId = order.UserId,
            Status = order.Status,
            CreatedAt = DateTime.UtcNow,
            Restaurant = selectedRestaurant
        };

        await restaurantOrderService.CreateAsync(restaurantOrder);
        
        logger.LogInformation("Created RestaurantOrder for OrderId: {OrderId}, RestaurantId: {RestaurantId}", 
            order.Id, selectedRestaurant.Id);
    }
}



