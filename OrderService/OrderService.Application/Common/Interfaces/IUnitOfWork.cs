using Contracts.Events;
using OrderService.Domain.Repositories;

namespace OrderService.Application.Common.Interfaces;

public interface IUnitOfWork
{
    ICartRepository CartRepository { get; }
    ICartItemRepository  CartItemRepository { get; }
    IOrderRepository OrderRepository { get; }

    Task<int> SaveChangesAsync(List<IEvent>? events = null,CancellationToken cancellationToken = default);
}