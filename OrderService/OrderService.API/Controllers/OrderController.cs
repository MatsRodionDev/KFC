using Contracts.Mediator;
using Contracts.Payment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.UseCases;
using OrderService.Infrastructure.Workflows;
using Temporalio.Client;

namespace OrderService.API.Controllers;

[Authorize]
[Controller]
[Route("api/orders")]
public class OrderController(IDispatcher dispatcher, ITemporalClient client) : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> GetByUserId(
        Guid id, 
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetOrderByIdQuery(id), cancellationToken));
    }
    
    [HttpPost("by_userid")]
    public async Task<IActionResult> GetByUserId(
        [FromBody] GetOrdersQuery query, 
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(query, cancellationToken));
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateOrder(
        [FromBody] OrderCreateCommand command, 
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
    
    [HttpPost("payment")]
    public async Task<IActionResult> UpdateOrderPayment(
        [FromBody] PaymentEvent paymentEvent,
        CancellationToken cancellationToken)
    {
        await client.SignalAsync<OrderWorkflow>(paymentEvent.OrderId, workflow => workflow.PaymentUpdateEvent(paymentEvent));
        return Ok();
        return Ok(await dispatcher.Dispatch(new UpdateCardPaymentStatusCommand(paymentEvent) ,cancellationToken));
    }
}