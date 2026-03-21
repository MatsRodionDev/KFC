using Catalog.Application.ProductUseCases;
using Catalog.Domain.Enums;
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

        public async Task<(List<Ingredient> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            string? name,
            bool? isBase,
            ProductCategory? forProductCategory,
            CancellationToken cancellationToken = default)
        {
            var query = context.Ingredients.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(i => i.Name.Contains(name));
            if (isBase.HasValue)
                query = query.Where(i => i.IsBase == isBase.Value);
            if (forProductCategory.HasValue)
                query = query.Where(i =>
                    i.ForProductCategory == forProductCategory.Value
                    || i.AvailableForProductCategory.Contains(forProductCategory.Value));
            var totalCount = await query.CountAsync(cancellationToken);
            var items = await query
                .OrderBy(i => i.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
            return (items, totalCount);
        }

        public async Task<List<Ingredient>> GetByCategoryAsync(ProductCategory category, CancellationToken cancellationToken)
        {
            return await context.Ingredients
                .AsNoTracking()
                .Where(i => i.ForProductCategory == category
                                    || i.AvailableForProductCategory.Contains(category))
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
