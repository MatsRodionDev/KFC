using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ToppingAggregate;
using Microsoft.EntityFrameworkCore;
using Shop.Domain.Enums;

namespace Catalog.Infrastructure.Persistence.Repositories
{
    internal sealed class ToppingRepository(ApplicationDbContext context) : IToppingRepository
    {
        public async Task<Topping?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await context
                .Toppings
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<List<Topping>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default)
        {
            return await context
                .Toppings
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(cancellationToken);
        }

        public async Task<(List<Topping> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            string? name,
            DrinkType? availableForDrinkType,
            CancellationToken cancellationToken = default)
        {
            var query = context.Toppings.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(t => t.Name.Contains(name));
            if (availableForDrinkType.HasValue)
                query = query.Where(t => t.AvailableForTypes.Contains(availableForDrinkType.Value));
            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .OrderBy(t => t.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
            return (items, totalCount);
        }

        public async Task AddAsync(Topping topping, CancellationToken cancellationToken = default)
        {
            await context.AddAsync(topping, cancellationToken);
        }

        public void Update(Topping topping)
        {
            context.Update(topping);
        }

        public void UpdateMany(List<Topping> toppings)
        {
            context.UpdateRange(toppings);
        }
    }
}
