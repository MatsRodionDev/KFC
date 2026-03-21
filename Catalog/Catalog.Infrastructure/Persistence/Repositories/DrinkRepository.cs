using Catalog.Domain.DrinkAggregate;
using Catalog.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Shop.Domain.Enums;

namespace Catalog.Infrastructure.Persistence.Repositories
{
    internal sealed class DrinkRepository(ApplicationDbContext context) : IDrinkRepository
    {
        public async Task<Drink?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await context
                .Drinks
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<List<Drink>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default)
        {
            return await context
                .Drinks
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(cancellationToken);
        }

        public async Task<(List<Drink> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            string? name,
            string? description,
            DrinkType? type,
            CancellationToken cancellationToken = default)
        {
            var query = context.Drinks.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(d => d.Name.Contains(name));
            if (!string.IsNullOrWhiteSpace(description))
                query = query.Where(d => d.Description.Contains(description));
            if (type.HasValue)
                query = query.Where(d => d.Type == type.Value);
            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .Include(d => d.DrinkToppings)
                .OrderBy(d => d.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
            return (items, totalCount);
        }
        
        public async Task<List<Drink>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await context
                .Drinks
                .Include(p => p.DrinkToppings)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(Drink drink, CancellationToken cancellationToken = default)
        {
            await context.AddAsync(drink, cancellationToken);
        }

        public void Update(Drink drink)
        {
            context.Update(drink);
        }

        public void UpdateMany(List<Drink> drinks)
        {
            context.UpdateRange(drinks);
        }
    }
}
