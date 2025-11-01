namespace Contracts.Order;

public class Order
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal TotalPrice { get; set; }
    public OrderStatus Status { get; set; }
    public Delivery Delivery { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}