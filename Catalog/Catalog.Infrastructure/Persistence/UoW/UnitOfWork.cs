using Catalog.Domain.Abstractions;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.Repositories;
using System.Text.Json;

namespace Catalog.Infrastructure.Persistence.UoW
{
    internal sealed class UnitOfWork(
        IDrinkRepository drinkRepository,
        IProductIngredientRepository productIngredientRepository,
        IProductRepository productRepository,
        IIngredientRepository ingredientRepository,
        IToppingRepository toppingRepository,
        ApplicationDbContext context) : IUnitOfWork
    {
        public IDrinkRepository DrinkRepository => drinkRepository;
        public IProductIngredientRepository ProductIngredientRepository => productIngredientRepository;
        public IProductRepository ProductRepository => productRepository;
        public IIngredientRepository IngredientRepository => ingredientRepository;
        public IToppingRepository ToppingRepository => toppingRepository;

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
