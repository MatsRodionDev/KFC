using Microsoft.EntityFrameworkCore;
using OrderService.Domain.Models;
using OrderService.Domain.Repositories;

namespace OrderService.Infrastructure.Persistence.Repositories;

internal sealed class OrderRepository(ApplicationDbContext context) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid orderId, CancellationToken cancellationToken)
    {
        return await context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
    }
    
    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        await context.AddAsync(order, cancellationToken);
    }
}