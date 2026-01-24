namespace PaymentService.Configuration;

public class StripeOptions
{
    public const string SectionName = "Stripe";
    
    public string ApiKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string Currency { get; set; } = "usd";
}

