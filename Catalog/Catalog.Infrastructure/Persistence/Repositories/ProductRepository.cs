using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ProductAggregate;
using Microsoft.EntityFrameworkCore;


namespace Catalog.Infrastructure.Persistence.Repositories
{
    internal sealed class ProductRepository(ApplicationDbContext context) : IProductRepository
    {
        public async Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await context
                .Products
                .Include(p => p.ProductIngredients)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<List<Product>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default)
        {
            return await context
                .Products
                .Include(p => p.ProductIngredients)
                .Where(p => ids.Contains(p.Id))
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
        {
            await context.AddAsync(product, cancellationToken);
        }

        public void Update(Product product)
        {
            context.Update(product);
        }

        public void UpdateMany(List<Product> products)
        {
            context.Products.UpdateRange(products);
        }
    }
}
