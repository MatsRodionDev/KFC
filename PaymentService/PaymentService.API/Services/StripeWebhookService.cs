using Microsoft.Extensions.Options;
using PaymentService.Configuration;
using Stripe;

namespace PaymentService.Services;

public class StripeWebhookService : IStripeWebhookService
{
    private readonly StripeOptions _stripeOptions;

    public StripeWebhookService(IOptions<StripeOptions> stripeOptions)
    {
        _stripeOptions = stripeOptions.Value;
    }

    public async Task<Event> ProcessWebhookAsync(string json, string signatureHeader, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_stripeOptions.WebhookSecret))
        {
            throw new InvalidOperationException("Webhook secret is not configured");
        }

        var stripeEvent = EventUtility.ParseEvent(json, throwOnApiVersionMismatch: false);
        stripeEvent = EventUtility.ConstructEvent(
            json,
            signatureHeader,
            _stripeOptions.WebhookSecret,
            throwOnApiVersionMismatch: false
        );

        return await Task.FromResult(stripeEvent);
    }
}

