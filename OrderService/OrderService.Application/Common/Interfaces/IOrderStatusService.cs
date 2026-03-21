using OrderService.Application.Common;

namespace OrderService.Application.Common.Interfaces;

public interface IOrderStatusService
{
    Task OrderStatusChanged(string userId, OrderSummaryDto order);
}