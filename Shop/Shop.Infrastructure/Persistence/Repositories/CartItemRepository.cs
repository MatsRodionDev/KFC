using Shop.Domain.CartAggregate;

namespace Shop.Infrastructure.Persistence.Repositories
{
    internal sealed class CartItemRepository(ApplicationDbContext context) : ICartItemRepository
    {
        public async Task AddAsync(CartItem cartItem, CancellationToken cancellationToken = default)
        {
            await context.AddAsync(cartItem, cancellationToken);
        }
    }
}
