using PaymentService.Services;
using Temporalio.Activities;

namespace PaymentService.Activities;

public class ExpireCheckoutSessionActivity(IStripeCheckoutService service)
{
    [Activity]
    public async Task ExpireCheckoutSessionAsync(string sessionId)
    {
        await service.ExpireCheckoutSessionAsync(sessionId, CancellationToken.None);
    }
}