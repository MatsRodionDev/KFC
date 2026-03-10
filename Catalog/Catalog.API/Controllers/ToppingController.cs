using Catalog.Application.ProductUseCases;
using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

// [Authorize]
[Controller]
[Route("api/toppings")]
public class ToppingController(IDispatcher dispatcher) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddTopping([FromForm] AddToppingCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}
