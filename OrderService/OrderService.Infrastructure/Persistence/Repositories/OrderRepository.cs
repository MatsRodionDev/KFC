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
            .Include(o => o.Payment)
            .ThenInclude(p => p.PaymentEvents)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
    }

    public async Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        return await context.Orders
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .ThenInclude(p => p.PaymentEvents)
            .Where(o => o.UserId == userId)
            .ToListAsync(cancellationToken);
    }
    
    public async Task<List<Order>> GetCurrentOrdersAsync(string userId, CancellationToken cancellationToken)
    {
        return await context.Orders
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .ThenInclude(p => p.PaymentEvents)
            .Where(o => o.UserId == userId)
            .Where(o => o.Status != OrderStatus.Cancelled 
                           && o.Status < OrderStatus.Shipped)   
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        await context.AddAsync(order, cancellationToken);
    }

    public void Update(Order order)
    {
        context.Attach(order);
    }
    
    public void UpdatePayment(Payment payment)
    {
        context.Attach(payment);
    }

    public async Task AddPaymentEventAsync(PaymentEvent paymentEvent, CancellationToken cancellationToken)
    {
        await context.AddAsync(paymentEvent, cancellationToken);
    }
}