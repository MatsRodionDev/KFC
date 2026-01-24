namespace OrderService.Domain.Models;

public enum OrderStatus
{
    Created,
    Paid,
    Ready,
    Shipped,
    Cancelled
}