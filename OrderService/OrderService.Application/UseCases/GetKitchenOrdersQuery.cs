using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

/// <summary>Заказы для кухонного экрана CRM: Paid, Cooking, Ready.</summary>
public record GetKitchenOrdersQuery : IQuery<List<Order>>;

public class GetKitchenOrdersQueryHandler(IUnitOfWork unitOfWork)
    : IQueryHandler<GetKitchenOrdersQuery, List<Order>>
{
    public Task<List<Order>> Handle(
        GetKitchenOrdersQuery query,
        CancellationToken cancellationToken)
        => unitOfWork.OrderRepository.GetKitchenOrdersAsync(cancellationToken);
}
