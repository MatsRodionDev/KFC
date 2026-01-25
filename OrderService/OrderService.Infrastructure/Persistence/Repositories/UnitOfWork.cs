using System.Text.Json;
using Contracts.Events;
using Contracts.Shared.Outbox;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Repositories;

namespace OrderService.Infrastructure.Persistence.Repositories;

public class UnitOfWork(ICartRepository cartRepository,
    ICartItemRepository cartItemRepository,
    IOrderRepository orderRepository,
    ApplicationDbContext context) : IUnitOfWork
{
    public ICartRepository CartRepository => cartRepository;
    public ICartItemRepository CartItemRepository => cartItemRepository; 
    public IOrderRepository OrderRepository => orderRepository;
    
    public async Task<int> SaveChangesAsync(List<IEvent>? events = null, CancellationToken cancellationToken = default)
    {
        if (events != null && events.Any())
        {
            var outboxes = events
                .Select(e => new Outbox
                {
                    Type = e.GetType().FullName!,
                    Content = JsonSerializer.Serialize(e, e.GetType()),
                    CreatedAt = DateTime.UtcNow
                }).ToList();
            
            await context.Outboxes.AddRangeAsync(outboxes, cancellationToken);
        }
        
        return await context.SaveChangesAsync(cancellationToken);
    }
}
