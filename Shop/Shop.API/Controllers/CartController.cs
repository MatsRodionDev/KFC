using Microsoft.AspNetCore.Mvc;
using Shop.Application.Common;
using Shop.Application.Common.Interfaces.Notifiers;
using Shop.Application.UseCases.AddItemToCart;
using Shop.Application.UseCases.ClearCart;
using Shop.Application.UseCases.DecreaseCartItemQuantity;
using Shop.Application.UseCases.GetCart;
using Shop.Application.UseCases.RemoveCartItem;
using Shop.Domain.OrderAggregate;

namespace Shop.API.Controllers
{
    [Controller]
    [Route("api/carts")]
    public class CartController(IDispatcher dispatcher, IWorkerNotifier workerNotifier) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetCart([FromQuery] GetCartQuery query, CancellationToken cancellationToken)
        {
            await workerNotifier.NotifyNewOrderAsync(Order.Create(query.UserId), cancellationToken);

            return Ok(await dispatcher.Dispatch(query, cancellationToken));
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> ClearCart(Guid userId, CancellationToken cancellationToken)
        {
            await dispatcher.Dispatch(new ClearCartCommand(userId), cancellationToken);

            return NoContent();
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItemToCart([FromBody] AddItemToCartCommand command, CancellationToken cancellationToken)
        {
            await dispatcher.Dispatch(command, cancellationToken);

            return Created();
        }

        [HttpPut("items")]
        public async Task<IActionResult> UpdateCartItemQuantity([FromBody] UpdateCartItemQuantityCommand command, CancellationToken cancellationToken)
        {
            await dispatcher.Dispatch(command, cancellationToken);

            return NoContent();
        }

        [HttpDelete("items")]
        public async Task<IActionResult> RemoveCartItemQuantity([FromBody] RemoveCartItemCommand command, CancellationToken cancellationToken)
        {
            await dispatcher.Dispatch(command, cancellationToken);

            return NoContent();
        }
    }
}
