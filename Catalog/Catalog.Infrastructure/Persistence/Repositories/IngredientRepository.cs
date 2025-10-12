using Catalog.Domain.IngredientAggregate;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ToppingAggregate;
using Microsoft.EntityFrameworkCore;

namespace Catalog.Infrastructure.Persistence.Repositories
{
    internal sealed class IngredientRepository(ApplicationDbContext context) : IIngredientRepository
    {
        public async Task<Ingredient?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await context
                .Ingredients
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<List<Ingredient>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default)
        {
            return await context
                .Ingredients
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(Ingredient ingredient, CancellationToken cancellationToken = default)
        {
            await context.AddAsync(ingredient, cancellationToken);
        }

        public void Update(Ingredient ingredient)
        {
            context.Update(ingredient);
        }

        public void UpdateMany(List<Ingredient> ingredients)
        {
            context.UpdateRange(ingredients);
        }
    }
}
