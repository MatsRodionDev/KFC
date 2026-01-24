using Contracts.Cache;
using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public record GetCurrentOrdersQuery(Guid UserId) : IQuery<List<Order>>;

public class GetCurrentOrdersQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetCurrentOrdersQuery, List<Order>>
{
    public async Task<List<Order>> Handle(GetCurrentOrdersQuery query, CancellationToken cancellationToken)
    {
        return await unitOfWork.OrderRepository.GetCurrentOrdersAsync(query.UserId, cancellationToken);
    }
}