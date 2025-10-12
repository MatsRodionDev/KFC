using Microsoft.AspNetCore.Mvc;
using OrderService.Application.Common.Mediator;
using OrderService.Application.UseCases;

namespace OrderService.API.Controllers;

[Controller]
[Route("api/orders")]
public class OrderController(IDispatcher dispatcher) : ControllerBase
{
    public async Task<IActionResult> CreateOrder(
        [FromBody] OrderCreateCommand command, 
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}