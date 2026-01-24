using PaymentService.Models;
using Stripe.Checkout;

namespace PaymentService.Services;

public interface IStripeCheckoutService
{
    Task<Session> CreateCheckoutSessionAsync(CreateCustomOrderRequest request, CancellationToken cancellationToken);
    Task<Session?> GetCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken);
    Task<Session> ExpireCheckoutSessionAsync(string sessionId, CancellationToken cancellationToken);
}

