using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record GetOrdersQuery(string customerId) : IQuery<List<Order>>;

public class GetOrdersQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetOrdersQuery, List<Order>>
{
    public async Task<List<Order>> Handle(GetOrdersQuery query, CancellationToken cancellationToken)
    {
        return await unitOfWork.OrderRepository.GetByUserIdAsync(query.customerId, cancellationToken);
    }
}

