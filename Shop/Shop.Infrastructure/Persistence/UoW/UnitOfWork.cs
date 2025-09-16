using Shop.Application.Common.Interfaces.UoW;
using Shop.Domain.Abstractions;
using Shop.Domain.Interfaces.Repositories;
using Shop.Infrastructure.Persistence.Repositories;
using System.Text.Json;

namespace Shop.Infrastructure.Persistence.UoW
{
    internal sealed class UnitOfWork(
        ICartRepository cartRepository,
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        ICartItemRepository cartItemRepository,
        ApplicationDbContext context) : IUnitOfWork
    {
        public ICartRepository CartRepository => cartRepository;

        public IOrderRepository OrderRepository => orderRepository;

        public IProductRepository ProductRepository => productRepository;

        public ICartItemRepository CartItemRepository => cartItemRepository;

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var domainEvents = context.ChangeTracker.Entries<Aggregate>()
                .Select(a => a.Entity)
                .Where(e => e.DomainEvents.Any())
                .SelectMany(e => e.DomainEvents)
                .ToList();

            var outboxes = domainEvents
                .Select(e => new Outbox.Outbox
                {
                    Type = e.GetType().FullName!,
                    Content = JsonSerializer.Serialize(e),
                    CreatedAt = DateTime.UtcNow
                }).ToList();

            if(outboxes.Any())
            {
                await context.Outboxes.AddRangeAsync(outboxes, cancellationToken);
            }

            return await context.SaveChangesAsync(cancellationToken);
        }
    }
}
