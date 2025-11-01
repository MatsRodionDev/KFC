using Contracts.Order;
using Microsoft.AspNetCore.SignalR;

namespace VenueService.BLL.Hubs;

public interface IOrderNotification
{
    Task NewOrderReceived(Order order);
}

public class OrderNotificationHub : Hub<IOrderNotification>
{
    
}