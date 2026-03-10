using Catalog.Domain.ProductAggregate;

namespace Catalog.Domain.Interfaces.Repositories
{
    public interface IProductRepository
    {
        Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Product>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task<List<Product>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<List<Product>> GetCustomAsync(string userId, CancellationToken cancellationToken = default);
        Task AddAsync(Product product, CancellationToken cancellationToken = default);
        void Update(Product product);
        void UpdateMany(List<Product> products);
    }
}
