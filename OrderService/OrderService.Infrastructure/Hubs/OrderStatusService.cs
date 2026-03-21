using Microsoft.AspNetCore.SignalR;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;

namespace OrderService.Infrastructure.Hubs;

public class OrderStatusService(IHubContext<OrderStatusHub, IOrderStatus> context) : IOrderStatusService
{
    public async Task OrderStatusChanged(string userId, OrderSummaryDto order)
    {
        await context.Clients.Groups(userId, $"{userId}:{order.Id}").ReceiveOrderStatus(order);
    }
}