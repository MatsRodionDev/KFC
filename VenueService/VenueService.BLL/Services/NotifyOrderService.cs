using Contracts.Order;
using Microsoft.AspNetCore.SignalR;
using VenueService.BLL.Hubs;

namespace VenueService.BLL.Services;

public interface INotifyOrderService
{
    Task Notify(Order order, Guid restaurantId);
}

internal sealed class NotifyOrderService(
    IHubContext<OrderNotificationHub, 
        IOrderNotification> hubContext) : INotifyOrderService
{
    public async Task Notify(Order order, Guid restaurantId)
    {
        await hubContext.Clients
            .Group(restaurantId.ToString())
            .NewOrderReceived(order);
    }
}