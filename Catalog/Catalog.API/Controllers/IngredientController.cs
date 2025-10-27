using Catalog.Application.ProductUseCases;
using Contracts.Mediator;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

[Controller]
[Route("api/ingredients")]
public class IngredientController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("{ingredientId:guid}")]
    public async Task<IActionResult> Get(Guid ingredientId, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetIngredientQuery(ingredientId), cancellationToken));
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIngredientCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}