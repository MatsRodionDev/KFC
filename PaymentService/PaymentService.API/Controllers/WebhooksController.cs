using Contracts.Mediator;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Handlers;
using PaymentService.Services;
using Stripe;
using Stripe.Checkout;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController(IDispatcher dispatcher, ILogger<WebhooksController> logger)
    : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> HandleWebhook(CancellationToken cancellationToken)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(cancellationToken);
        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            return BadRequest(new { error = "Missing Stripe-Signature header" });
        }

        try
        {
            await dispatcher.Dispatch(new ProcessWebhookEventCommand(json, signatureHeader), cancellationToken);

            return Ok(new { received = true });
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe webhook error");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing webhook");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private Task HandlePaymentIntentSucceeded(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        logger.LogInformation("PaymentIntent succeeded: {PaymentIntentId}, Amount: {Amount} {@Event}", 
            paymentIntent?.Id, paymentIntent?.Amount, stripeEvent);
        return Task.CompletedTask;
    }

    private Task HandlePaymentIntentFailed(Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        logger.LogWarning("PaymentIntent failed: {PaymentIntentId}, Amount: {Amount}", 
            paymentIntent?.Id, paymentIntent?.Amount);
        return Task.CompletedTask;
    }

    private Task HandleCheckoutSessionCompleted(Event stripeEvent)
    {
        var session = stripeEvent.Data.Object as Session;
        logger.LogInformation("Checkout session completed: {SessionId}, Customer: {CustomerId} {@Event}", 
            session?.Id, session?.CustomerId, stripeEvent);
        return Task.CompletedTask;
    }
}

