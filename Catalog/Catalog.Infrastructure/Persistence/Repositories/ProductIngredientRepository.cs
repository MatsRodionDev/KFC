using Catalog.Domain.ProductAggregate;
using Catalog.Domain.Repositories;

namespace Catalog.Infrastructure.Persistence.Repositories
{
    internal sealed class ProductIngredientRepository(ApplicationDbContext context) : IProductIngredientRepository
    {
        public async Task AddAsync(ProductIngredient productIngredient, CancellationToken cancellationToken = default)
        {
            await context.AddAsync(productIngredient, cancellationToken);
        }
    }
}
