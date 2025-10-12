using OrderService.Domain.Models;

namespace OrderService.Domain.Repositories;

public interface ICartItemRepository
{
    Task AddAsync(CartItem cartItem, CancellationToken cancellationToken = default);
}