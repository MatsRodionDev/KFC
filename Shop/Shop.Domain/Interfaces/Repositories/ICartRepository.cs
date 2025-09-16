using Shop.Domain.CartAggregate;

namespace Shop.Domain.Interfaces.Repositories
{
    public interface ICartRepository
    {
        Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
        Task CreateAsync(Cart cart, CancellationToken cancellationToken = default);
        void Update(Cart cart);
    }
}
