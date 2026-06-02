using Contracts.Mediator;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

/// <summary>
/// Команда перевода заказа в статус Ready после CV-верификации комплектности.
/// </summary>
/// <param name="OrderId">ID заказа.</param>
/// <param name="ImageStream">Поток байт фотографии собранного заказа.</param>
/// <param name="FileName">Имя файла изображения.</param>
public record MarkOrderReadyCommand(
    Guid OrderId,
    Stream ImageStream,
    string FileName) : ICommand<MarkOrderReadyResult>;

/// <summary>Результат команды.</summary>
public record MarkOrderReadyResult(
    bool Success,
    bool CvVerified,
    string Message);

public class MarkOrderReadyCommandHandler(
    IUnitOfWork unitOfWork,
    ICvVerificationService cvService,
    IOrderStatusService orderStatusService)
    : ICommandHandler<MarkOrderReadyCommand, MarkOrderReadyResult>
{
    public async Task<MarkOrderReadyResult> Handle(
        MarkOrderReadyCommand command,
        CancellationToken cancellationToken)
    {
        var order = await unitOfWork.OrderRepository.GetByIdAsync(
            command.OrderId, cancellationToken);

        if (order is null)
            return new MarkOrderReadyResult(false, false, "Заказ не найден.");

        if (order.Status != OrderStatus.Cooking)
            return new MarkOrderReadyResult(
                false, false,
                $"Перевод в Ready возможен только из статуса Cooking. Текущий: {order.Status}.");

        // Собираем позиции заказа для CV
        var orderItems = order.Items
            .Select(i => new OrderItemDto(i.Name, i.Quantity))
            .ToList();

        // Вызов CV-сервиса
        var cvResult = await cvService.VerifyOrderCompletenessAsync(
            command.ImageStream,
            command.FileName,
            orderItems,
            cancellationToken);

        if (!cvResult.Verified)
        {
            return new MarkOrderReadyResult(
                Success: false,
                CvVerified: false,
                Message: cvResult.Message);
        }

        // CV подтвердила — переводим статус и генерируем QR-токен для курьера
        order.Status = OrderStatus.Ready;
        order.PickupToken = Guid.NewGuid().ToString("N"); // 32-символьный hex-токен
        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);

        await orderStatusService.OrderStatusChanged(
            order.UserId,
            new OrderSummaryDto(order.Id, order.Delivery.ServiceType, order.Status));

        return new MarkOrderReadyResult(
            Success: true,
            CvVerified: true,
            Message: cvResult.Message);
    }
}
