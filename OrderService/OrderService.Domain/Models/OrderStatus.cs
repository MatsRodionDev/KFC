namespace OrderService.Domain.Models;

public enum OrderStatus
{
    Created,
    Paid,
    Cooking,
    Ready,
    InDelivery,
    Collected,
    Cancelled
}
