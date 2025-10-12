namespace OrderService.Domain.Models;

public class Order
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal TotalPrice { get; set; }
    public OrderStatus Status { get; set; }
    public ServiceType ServiceType { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}