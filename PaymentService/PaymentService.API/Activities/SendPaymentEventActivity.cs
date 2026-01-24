using Contracts.Payment;
using PaymentService.Clients;
using Temporalio.Activities;

namespace PaymentService.Activities;

public class SendPaymentEventActivity(
    IOrderServiceClient orderServiceClient,
    ILogger<SendPaymentEventActivity> logger)
{
    [Activity]
    public async Task<Guid?> SendPaymentEventAsync(PaymentEvent paymentEvent)
    {
        try
        {
            var response = await orderServiceClient.SendPaymentEventAsync(paymentEvent, CancellationToken.None);

            return response.Content;
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to send payment event for OrderId: {OrderId}, CheckoutId: {CheckoutId}",
                paymentEvent.OrderId,
                paymentEvent.CheckoutId);
            throw;
        }
    }
}