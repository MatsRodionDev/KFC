using Shop.Domain.CartAggregate;

namespace Shop.Domain.Interfaces.Repositories
{
    public interface ICartItemRepository
    {
        Task AddAsync(CartItem cartItem, CancellationToken cancellationToken = default);
    }
}
