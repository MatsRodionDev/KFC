using Catalog.Domain.Enums;
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
        
        public async Task<List<Product>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await context
                .Products
                .Include(p => p.ProductIngredients)
                .Where(p => p.UserId == null)
                .ToListAsync(cancellationToken);
        }
        
        public async Task<List<Product>> GetCustomAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await context
                .Products
                .Include(p => p.ProductIngredients)
                .Where(p => p.UserId == userId)
                .ToListAsync(cancellationToken);
        }

        public async Task<(List<Product> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            string? name,
            string? description,
            ProductCategory? productCategory,
            string? userId,
            CancellationToken cancellationToken = default)
        {
            var query = context.Products.AsQueryable();

            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(p => p.Name.Contains(name));
            if (!string.IsNullOrWhiteSpace(description))
                query = query.Where(p => p.Description.Contains(description));
            if (productCategory.HasValue)
                query = query.Where(p => p.ProductCategory == productCategory.Value);
            if (!string.IsNullOrWhiteSpace(userId))
                query = query.Where(p => p.UserId == userId);

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .Include(p => p.ProductIngredients)
                .OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalCount);
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
