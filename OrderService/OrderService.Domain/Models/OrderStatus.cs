namespace OrderService.Domain.Models;

public enum OrderStatus
{
    Created,
    Ready,
    Shipped,
    Cancelled
}