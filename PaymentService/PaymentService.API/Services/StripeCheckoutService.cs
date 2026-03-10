using PaymentService.Extensions;
using PaymentService.Models;
using Stripe;
using Stripe.Checkout;

namespace PaymentService.Services;

public class StripeCheckoutService(
    SessionService sessionService,
    ILogger<StripeCheckoutService> logger)
    : IStripeCheckoutService
{
    private readonly ILogger<StripeCheckoutService> _logger = logger;
    
    public async Task<Session?> GetCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken)
    {
        try
        {
            return await sessionService.GetAsync(sessionId, cancellationToken: cancellationToken);
        }
        catch (StripeException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Session> ExpireCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken)
    {
        return await sessionService.ExpireAsync(sessionId, cancellationToken: cancellationToken);
    }

    public async Task<Session> CreateCheckoutSessionAsync(
        CreateCustomOrderRequest request,
        CancellationToken cancellationToken)
    {
        var lineItems = request.Items.Select(item => item.ToSessionLineItemOptions()).ToList();
        
        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = request.SuccessUrl,
            CancelUrl = request.CancelUrl,
            LineItems = lineItems,
            Metadata = new Dictionary<string, string>
            {
                { "OrderId", request.OrderId.ToString() }
            }
        };

        return await sessionService.CreateAsync(options, cancellationToken: cancellationToken);
    }
}

