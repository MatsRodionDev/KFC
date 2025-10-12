using Catalog.Application.Common.Mediator;
using Catalog.Application.ProductUseCases;
using Catalog.Domain.ProductAggregate;
using Microsoft.AspNetCore.Mvc;

namespace Catalog.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductController(IDispatcher dispatcher) : ControllerBase
{
    [HttpGet("{productId}")]
    public async Task<IActionResult> GetProduct(Guid productId, CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetProductQuery(productId), cancellationToken));
    }
    
    [HttpPost]
    public async Task<IActionResult> AddProduct([FromBody] AddProductCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }
}