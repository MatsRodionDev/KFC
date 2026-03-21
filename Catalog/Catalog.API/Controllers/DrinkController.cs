using Catalog.Application.ProductUseCases;
using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Domain.Enums;

namespace Catalog.API.Controllers;

// [Authorize]
[ApiController]
[Route("api/drinks")]
public class DrinkController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? name = null,
        [FromQuery] string? description = null,
        [FromQuery] DrinkType? type = null,
        CancellationToken cancellationToken = default)
    {
        var result = await dispatcher.Dispatch(
            new GetDrinksPagedQuery(page, pageSize, name, description, type),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddDrink([FromForm] AddDrinkCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}
