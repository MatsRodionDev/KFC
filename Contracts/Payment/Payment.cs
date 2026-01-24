namespace Contracts.Payment;

public class PaymentEvent
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string CheckoutId { get; set; }
    public string CustomerId { get; set; }
    public PaymentStatus Status { get; set; }
    public DateTime OccuredAt { get; set; }
}

public enum PaymentStatus
{
    Pending,
    Canceled,
    Expired,
    Completed 
}