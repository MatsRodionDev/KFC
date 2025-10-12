using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ToppingAggregate;
using Microsoft.EntityFrameworkCore;

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
