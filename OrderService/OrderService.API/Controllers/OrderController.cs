using Contracts.Mediator;
using Contracts.Payment;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.UseCases;
using OrderService.Infrastructure.Workflows;
using Temporalio.Client;

namespace OrderService.API.Controllers;

// [Authorize]
[Controller]
[Route("api/orders")]
public class OrderController(IDispatcher dispatcher, ITemporalClient client) : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(new GetOrderByIdQuery(id), cancellationToken));
    }

    [HttpPost("by_userid")]
    public async Task<IActionResult> GetByUserId(
        [FromBody] GetOrdersQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(query, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder(
        [FromBody] OrderCreateCommand command,
        CancellationToken cancellationToken)
    {
        return Ok(await dispatcher.Dispatch(command, cancellationToken));
    }

    [HttpPost("payment")]
    public async Task<IActionResult> UpdateOrderPayment(
        [FromBody] PaymentEvent paymentEvent,
        CancellationToken cancellationToken)
    {
        await client.SignalAsync<OrderWorkflow>(
            paymentEvent.OrderId,
            workflow => workflow.PaymentUpdateEvent(paymentEvent));
        return Ok();
    }

    /// <summary>
    /// CV-верификация комплектности заказа. Принимает фото (multipart/form-data).
    /// Если CV подтверждает — переводит заказ в Ready и генерирует PickupToken.
    /// </summary>
    [HttpPost("{id:guid}/verify-ready")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> VerifyOrderReady(
        Guid id,
        IFormFile image,
        CancellationToken cancellationToken)
    {
        if (image is null || image.Length == 0)
            return BadRequest(new { error = "Необходимо прикрепить фото заказа." });

        await using var stream = image.OpenReadStream();
        var command = new MarkOrderReadyCommand(id, stream, image.FileName);
        var result = await dispatcher.Dispatch(command, cancellationToken);

        if (!result.Success)
        {
            return UnprocessableEntity(new
            {
                cvVerified = result.CvVerified,
                message = result.Message,
            });
        }

        return Ok(new
        {
            cvVerified = result.CvVerified,
            message = result.Message,
        });
    }

    /// <summary>
    /// Возвращает QR-payload для подтверждения получения заказа курьером.
    /// Используется оператором/CRM для отображения QR-кода на экране.
    /// GET /api/orders/{id}/pickup-qr
    /// </summary>
    [HttpGet("{id:guid}/pickup-qr")]
    public async Task<IActionResult> GetPickupQr(
        Guid id,
        CancellationToken cancellationToken)
    {
        var order = await dispatcher.Dispatch(new GetOrderByIdQuery(id), cancellationToken);

        if (order is null)
            return NotFound();

        if (order.PickupToken is null)
            return BadRequest(new { error = "Заказ ещё не готов или токен уже использован." });

        // Возвращаем токен — фронт/CRM сам рендерит QR из этой строки
        return Ok(new
        {
            orderId = order.Id,
            token = order.PickupToken,
            qrPayload = $"delivery-pickup:{order.Id}:{order.PickupToken}",
        });
    }

    /// <summary>
    /// Подтверждение получения заказа по QR-токену (курьер сканирует QR на упаковке).
    /// Переводит заказ Ready → Shipped и аннулирует токен.
    /// POST /api/orders/{id}/confirm-pickup
    /// Body: { "token": "..." }
    /// </summary>
    [HttpPost("{id:guid}/confirm-pickup")]
    public async Task<IActionResult> ConfirmPickup(
        Guid id,
        [FromBody] ConfirmPickupRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return BadRequest(new { error = "Токен не может быть пустым." });

        var command = new ConfirmPickupCommand(id, request.Token);
        var result = await dispatcher.Dispatch(command, cancellationToken);

        if (!result.Success)
            return UnprocessableEntity(new { message = result.Message });

        return Ok(new { message = result.Message });
    }
}

/// <summary>Тело запроса подтверждения получения.</summary>
public record ConfirmPickupRequest(string Token);
