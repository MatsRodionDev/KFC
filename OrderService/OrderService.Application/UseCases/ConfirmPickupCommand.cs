using Contracts.Mediator;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

/// <summary>
/// Подтверждение получения заказа курьером по QR-токену.
/// Переводит заказ из Ready → Shipped.
/// </summary>
/// <param name="OrderId">ID заказа.</param>
/// <param name="Token">Токен, отсканированный из QR-кода на упаковке.</param>
public record ConfirmPickupCommand(Guid OrderId, string Token) : ICommand<ConfirmPickupResult>;

public record ConfirmPickupResult(bool Success, string Message);

public class ConfirmPickupCommandHandler(
    IUnitOfWork unitOfWork,
    IOrderStatusService orderStatusService)
    : ICommandHandler<ConfirmPickupCommand, ConfirmPickupResult>
{
    public async Task<ConfirmPickupResult> Handle(
        ConfirmPickupCommand command,
        CancellationToken cancellationToken)
    {
        var order = await unitOfWork.OrderRepository.GetByIdAsync(
            command.OrderId, cancellationToken);

        if (order is null)
            return new ConfirmPickupResult(false, "Заказ не найден.");

        if (order.Status != OrderStatus.Ready)
            return new ConfirmPickupResult(
                false,
                $"Получение возможно только из статуса Ready. Текущий: {order.Status}.");

        // Проверяем токен
        if (string.IsNullOrWhiteSpace(order.PickupToken)
            || !string.Equals(order.PickupToken, command.Token.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            return new ConfirmPickupResult(
                false,
                "Неверный QR-код. Убедитесь, что сканируете код именно этого заказа.");
        }

        // Токен принят — переводим статус и аннулируем токен
        order.Status = OrderStatus.Shipped;
        order.PickupToken = null;
        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);

        await orderStatusService.OrderStatusChanged(
            order.UserId,
            new OrderSummaryDto(order.Id, order.Delivery.ServiceType, order.Status));

        return new ConfirmPickupResult(true, "Заказ принят. Счастливого пути!");
    }
}
