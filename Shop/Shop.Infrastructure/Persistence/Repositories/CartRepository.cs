using Microsoft.EntityFrameworkCore;
using Shop.Domain.CartAggregate;
using Shop.Domain.Interfaces.Repositories;

namespace Shop.Infrastructure.Persistence.Repositories
{
    internal sealed class CartRepository(ApplicationDbContext context) : ICartRepository
    {
        public async Task CreateAsync(Cart cart, CancellationToken cancellationToken = default)
        {
            await context.Carts.AddAsync(cart, cancellationToken);
        }

        public Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return context.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);
        }

        public void Update(Cart cart)
        {
            context.Carts.Update(cart);
        }
    }
}
