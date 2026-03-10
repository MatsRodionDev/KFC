using Catalog.Application.ProductUseCases;
using Contracts.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

// [Authorize]
[ApiController]
[Route("api/products")]
public class ProductController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("{productId}")]
    public async Task<IActionResult> GetProduct(Guid productId, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetProductQuery(productId), cancellationToken));
    }
    
    [HttpGet("custom/{userId}")]
    public async Task<IActionResult> GetCustomProducts(string userId, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetCustomProductsQuery(userId), cancellationToken));
    }
    
    [HttpPost]
    public async Task<IActionResult> AddProduct([FromForm] AddProductCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
    
    [HttpPost("custom")]
    public async Task<IActionResult> AddCustomProduct([FromBody] AddCustomProductCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}
