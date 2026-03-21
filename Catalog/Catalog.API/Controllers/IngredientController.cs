using Catalog.Application.ProductUseCases;
using Catalog.Domain.Enums;
using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

// [Authorize]
[Controller]
[Route("api/ingredients")]
public class IngredientController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? name = null,
        [FromQuery] bool? isBase = null,
        [FromQuery] ProductCategory? forProductCategory = null,
        CancellationToken cancellationToken = default)
    {
        var result = await dispatcher.Dispatch(
            new GetIngredientsPagedQuery(page, pageSize, name, isBase, forProductCategory),
            cancellationToken);
        return Ok(result);
    }

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
