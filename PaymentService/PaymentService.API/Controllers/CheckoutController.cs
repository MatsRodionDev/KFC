using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Handlers;
using PaymentService.Services;

namespace PaymentService.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CheckoutController(IStripeCheckoutService checkoutService, IDispatcher dispatcher, ILogger<CheckoutController> logger)
    : ControllerBase
{
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateCustomCheckoutSession(
        [FromBody] CreateSessionCommand command,
        CancellationToken cancellationToken)
    {
        var session = await dispatcher.Dispatch(command, cancellationToken);

        return Ok(session);
    }

    [HttpGet("sessions/{sessionId}")]
    public async Task<IActionResult> GetCheckoutSession(string sessionId, CancellationToken cancellationToken)
    {
        var session = await checkoutService.GetCheckoutSessionAsync(sessionId, cancellationToken);
        if (session == null)
        {
            return NotFound();
        }
        return Ok(session);
    }

    [HttpPost("sessions/{sessionId}/expire")]
    public async Task<IActionResult> ExpireCheckoutSession(string sessionId, CancellationToken cancellationToken)
    {
        var session = await checkoutService.ExpireCheckoutSessionAsync(sessionId, cancellationToken);
        return Ok(session);
    }
}

