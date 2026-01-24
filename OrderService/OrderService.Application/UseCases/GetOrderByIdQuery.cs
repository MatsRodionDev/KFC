using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record GetOrderByIdQuery(Guid orderId) : IQuery<Order>;

public class GetOrderByIdQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetOrderByIdQuery, Order>
{
    public async Task<Order> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        return await unitOfWork.OrderRepository.GetByIdAsync(query.orderId, cancellationToken)
               ?? throw new Exception($"Order with id: {query.orderId} not found");
    }
}