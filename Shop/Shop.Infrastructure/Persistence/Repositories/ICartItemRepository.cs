using Shop.Domain.CartAggregate;

namespace Shop.Infrastructure.Persistence.Repositories
{
    public interface ICartItemRepository
    {
        Task AddAsync(CartItem cartItem, CancellationToken cancellationToken = default);
    }
}
