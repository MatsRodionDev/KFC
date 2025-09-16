
using Shop.Domain.Interfaces.Repositories;

namespace Shop.Application.Common.Interfaces.UoW
{
    public interface IUnitOfWork
    {
        ICartRepository CartRepository { get; }
        IOrderRepository OrderRepository { get; }
        IProductRepository ProductRepository { get; }
        ICartItemRepository CartItemRepository { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
