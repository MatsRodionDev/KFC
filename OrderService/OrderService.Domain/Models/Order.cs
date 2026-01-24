namespace OrderService.Domain.Models;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public decimal TotalPrice { get; set; }
    public OrderStatus Status { get; set; }
    public Delivery Delivery { get; set; }
    public Payment Payment { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}