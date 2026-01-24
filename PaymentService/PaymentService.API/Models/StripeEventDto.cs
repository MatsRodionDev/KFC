namespace PaymentService.Models;

public class StripeEventDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string? CustomerId { get; set; }
    public string? CustomerEmail { get; set; }
    public long AmountTotal { get; set; }
    public string Currency { get; set; } = "usd";
    public string? PaymentStatus { get; set; }
    public DateTime Created { get; set; }
}



