using Catalog.Application.ProductUseCases;
using Catalog.Domain.Enums;
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
    
    [HttpGet("{category}")]
    public async Task<IActionResult> GetByCategory(ProductCategory category, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetIngredientsForCategoryQuery(category), cancellationToken));
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateIngredientCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
    
    [HttpPost("base")]
    public async Task<IActionResult> Create([FromForm] CreateBaseIngredientCommand command, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}