using Contracts.Mediator;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.Common.Clients;
using OrderService.Application.UseCases;

namespace OrderService.API.Controllers;

[Controller]
[Route("api/orders")]
public class OrderController(IDispatcher dispatcher, ICoordinatesApi api) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateOrder(
        [FromBody] OrderCreateCommand command, 
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
    
    [HttpPost("address")]
    public async Task<IActionResult> SetAddress(
        [FromBody] SetDeliveryCommand command, 
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}