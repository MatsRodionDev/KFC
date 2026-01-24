namespace PaymentService.Worlflows;

public class PaymentWorkflowInput
{
    public Guid OrderId { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string? CustomerId { get; set; }
    public string? CustomerEmail { get; set; }
    public long AmountTotal { get; set; }
    public string Currency { get; set; } = "usd";
}

