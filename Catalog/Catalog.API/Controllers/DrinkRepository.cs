using Catalog.Application.Common.Mediator;
using Catalog.Application.ProductUseCases;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

[Controller]
[Route("api/drinks")]
public class DrinkRepository(IDispatcher dispatcher) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddDrink([FromBody] AddDrinkCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}