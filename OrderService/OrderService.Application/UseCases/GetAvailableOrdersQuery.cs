using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

/// <summary>
/// Возвращает список заказов в статусе Ready — доступных для принятия курьером.
/// </summary>
public record GetAvailableOrdersQuery : IQuery<List<Order>>;

public class GetAvailableOrdersQueryHandler(IUnitOfWork unitOfWork)
    : IQueryHandler<GetAvailableOrdersQuery, List<Order>>
{
    public Task<List<Order>> Handle(
        GetAvailableOrdersQuery query,
        CancellationToken cancellationToken)
        => unitOfWork.OrderRepository.GetAvailableForCouriersAsync(cancellationToken);
}
