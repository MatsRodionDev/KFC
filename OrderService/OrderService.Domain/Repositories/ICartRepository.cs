using OrderService.Domain.Models;

namespace OrderService.Domain.Repositories;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task AddAsync(Cart cart, CancellationToken cancellationToken = default);
}