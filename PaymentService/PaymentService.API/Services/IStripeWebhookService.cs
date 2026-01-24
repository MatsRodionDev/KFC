using Stripe;

namespace PaymentService.Services;

public interface IStripeWebhookService
{
    Task<Event> ProcessWebhookAsync(string json, string signatureHeader, CancellationToken cancellationToken);
}

