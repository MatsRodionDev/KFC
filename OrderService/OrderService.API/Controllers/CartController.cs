using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.UseCases;

namespace OrderService.API.Controllers;

// [Authorize]
[Controller]
[Route("api/carts")]
public class CartController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetCart(string userId, CancellationToken cancellationToken)
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
    
    [HttpPut("items")]
    public async Task<IActionResult> UpdateItem(
        [FromBody] CartUpdateItemCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
    
    [HttpPut("items/ingredients")]
    public async Task<IActionResult> UpdateItemIngredients(
        [FromBody] CartUpdateItemIngredientsCommand command,
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