using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Common;
using Shop.Application.UseCases.CreateOrder;

namespace Shop.API.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrderController(IDispatcher dispatcher) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderCommand command, CancellationToken cancellationToken)
        {
            await dispatcher.Dispatch(command, cancellationToken);

            return Created();
        }
    }
}
