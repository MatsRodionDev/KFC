using Microsoft.EntityFrameworkCore;
using OrderService.Domain.Models;
using OrderService.Domain.Repositories;

namespace OrderService.Infrastructure.Persistence.Repositories;

public class CartRepository(ApplicationDbContext context) : ICartRepository
{
    public Task<Cart?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
    }

    public async Task AddAsync(Cart cart, CancellationToken cancellationToken = default)
    {
        await context.Carts.AddAsync(cart, cancellationToken);
    }
}