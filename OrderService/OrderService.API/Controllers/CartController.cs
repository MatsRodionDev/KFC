using Contracts.Mediator;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.UseCases;

namespace OrderService.API.Controllers;

[Controller]
[Route("api/carts")]
public class CartController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetCart(Guid userId, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetCartQuery(userId), cancellationToken));
    }
    
    [HttpPost("items")]
    public async Task<IActionResult> AddItemToCart(
        [FromBody] CartAddProductItemCommand cartAddProductCommand,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(cartAddProductCommand, cancellationToken));
    }
}