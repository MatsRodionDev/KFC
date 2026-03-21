using Catalog.Application.ProductUseCases;
using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Domain.Enums;

namespace Catalog.API.Controllers;

// [Authorize]
[ApiController]
[Route("api/toppings")]
public class ToppingController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? name = null,
        [FromQuery] DrinkType? availableForDrinkType = null,
        CancellationToken cancellationToken = default)
    {
        var result = await dispatcher.Dispatch(
            new GetToppingsPagedQuery(page, pageSize, name, availableForDrinkType),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddTopping([FromForm] AddToppingCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}
