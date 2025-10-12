using OrderService.Domain.Models;

namespace OrderService.Domain.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid orderId, CancellationToken cancellationToken);
    Task AddAsync(Order order, CancellationToken cancellationToken);
}