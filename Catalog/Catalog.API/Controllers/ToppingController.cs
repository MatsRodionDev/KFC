using Catalog.Application.Common.Mediator;
using Catalog.Application.ProductUseCases;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

[Controller]
[Route("api/toppings")]
public class ToppingController(IDispatcher dispatcher) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddTopping([FromBody] AddToppingCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}