using Shop.Domain.OrderAggregate;

namespace Shop.Domain.Interfaces.Repositories
{
    public interface IOrderRepository
    {
        Task CreateAsync(Order order, CancellationToken cancellationToken = default);
    }
}
