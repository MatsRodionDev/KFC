using Contracts.Mediator;
using PaymentService.Controllers;
using PaymentService.Extensions;
using PaymentService.Models;
using PaymentService.Services;
using PaymentService.Worlflows;
using Stripe.Checkout;
using Temporalio.Client;

namespace PaymentService.Handlers;

public record ProcessWebhookEventCommand(string EventJson, string SignatureHeader) : ICommand<bool>;

public class ProcessWebhookEventHandler(
    IStripeWebhookService webhookService, 
    ITemporalClient client, 
    ILogger<WebhooksController> logger) : ICommandHandler<ProcessWebhookEventCommand, bool>
{
    public async Task<bool> Handle(ProcessWebhookEventCommand command, CancellationToken cancellationToken)
    {
        var stripeEvent = await webhookService.ProcessWebhookAsync(command.EventJson, command.SignatureHeader, cancellationToken);

        try
        {
            logger.LogInformation("Event {Type}", stripeEvent.Type);
            
            if (stripeEvent.Data.Object is Session session)
            {
                if (!session.Metadata.TryGetValue("OrderId", out var orderIdStr) || 
                    !Guid.TryParse(orderIdStr, out var orderId))
                {
                    logger.LogWarning(
                        "Session {SessionId} does not have OrderId in metadata, cannot send signal to workflow",
                        session.Id);
                    return false;
                }

                var eventDto = new StripeEventDto
                {
                    Id = stripeEvent.Id,
                    Type = stripeEvent.Type,
                    SessionId = session.Id,
                    CustomerId = session.CustomerId,
                    CustomerEmail = session.CustomerEmail,
                    AmountTotal = session.AmountTotal ?? 0,
                    Currency = session.Currency ?? "usd",
                    PaymentStatus = session.PaymentStatus,
                    Created = stripeEvent.Created
                };

                try
                {
                     await client.SignalAsync<PaymentWorkflow>(orderId, w => w.StripeEvent(eventDto));

                    logger.LogInformation(
                        "{SessionId} Send Signal to Workflow {Type}",
                        session.Id,
                        stripeEvent.Type);

                    return true;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(
                        "Workflow not found for OrderId: {OrderId}, SessionId: {SessionId}",
                        orderId,
                        session.Id);
                    return false;
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning("Send Signal Error {Message}", ex.Message);
        }
        
        return false;
    }
}