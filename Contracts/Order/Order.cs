namespace Contracts.Order;

public class Order
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public OrderStatus Status { get; set; }
    public Delivery Delivery { get; set; }
    public Payment Payment { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public decimal AmountTotal { get; set; }
    public bool Paid { get; set; }
    public string? CheckoutId { get; set; }
    public PaymentStatus? Status { get; set; }
    public List<PaymentEvent>? PaymentEvents { get; set; }
}

public class PaymentEvent
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public Guid OrderId { get; set; }
    public string CheckoutId { get; set; }
    public string CustomerId { get; set; }
    public PaymentStatus? Status { get; set; }
    public DateTime OccuredAt { get; set; }
}

public enum PaymentMethod
{
    Card,
    Cash
}

public enum PaymentStatus
{
    Pending,
    Canceled,
    Expired,
    Completed 
}