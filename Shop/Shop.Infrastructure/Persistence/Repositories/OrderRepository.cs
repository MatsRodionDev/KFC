using Shop.Domain.Interfaces.Repositories;
using Shop.Domain.OrderAggregate;

namespace Shop.Infrastructure.Persistence.Repositories
{
    internal sealed class OrderRepository(ApplicationDbContext context) : IOrderRepository
    {
        public async Task CreateAsync(Order order, CancellationToken cancellationToken = default)
        {
            await context.Orders.AddAsync(order, cancellationToken);
        }
    }
}
