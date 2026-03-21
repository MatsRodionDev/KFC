namespace OrderService.Domain.Models;

public enum OrderStatus
{
    Created,
    Paid,
    Cooking,
    Ready,
    Shipped,
    Cancelled
}