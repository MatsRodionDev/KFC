using Microsoft.AspNetCore.Mvc;
using Shop.Application.Common;
using Shop.Application.UseCases.CreateProduct;

namespace Shop.API.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductController(IDispatcher dispatcher) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken cancellationToken)
        {
            await dispatcher.Dispatch(command, cancellationToken);

            return Created();
        }
    }
}
