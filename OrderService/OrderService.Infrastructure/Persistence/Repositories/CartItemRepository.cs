using OrderService.Domain.Models;
using OrderService.Domain.Repositories;

namespace OrderService.Infrastructure.Persistence.Repositories;

public class CartItemRepository(ApplicationDbContext context) : ICartItemRepository
{
    public async Task AddAsync(CartItem cartItem, CancellationToken cancellationToken = default)
    {
        await context.AddAsync(cartItem, cancellationToken);
    }
}