using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Common;
using OrderService.Domain.Models;
using OrderService.Infrastructure.Persistence;

namespace OrderService.Infrastructure.Hubs;

public interface IOrderStatus
{
    Task ReceiveOrders(List<OrderSummaryDto> orders);
    Task ReceiveOrderStatus(OrderSummaryDto order);
}

public class OrderStatusHub(ApplicationDbContext context) : Hub<IOrderStatus>
{
    public async Task ConnectToOrdersStatuses(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        var orders = (await context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId
                        && o.Status != OrderStatus.Cancelled
                        && o.Status < OrderStatus.Shipped)
            .ToListAsync())
            .Select(o => new OrderSummaryDto(o.Id, o.Delivery.ServiceType, o.Status)).ToList();

        // Всегда отправляем список (в т.ч. пустой), чтобы клиент знал, что данные получены по SignalR.
        await Clients.Caller.ReceiveOrders(orders);
    }
    
    public async Task ConnectToOrderStatuses(string userId,  Guid orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"{userId}:{orderId}");
    }
}