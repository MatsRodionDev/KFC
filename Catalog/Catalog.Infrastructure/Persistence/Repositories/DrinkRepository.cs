using Catalog.Domain.DrinkAggregate;
using Catalog.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

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
