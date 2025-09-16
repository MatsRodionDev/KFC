using Shop.Domain.ProductAggregate;

namespace Shop.Domain.Interfaces.Repositories
{
    public interface IProductRepository
    {
        Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Product>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task AddAsync(Product product, CancellationToken cancellationToken = default);
        void Update(Product product);
        void UpdateMany(List<Product> products);
    }
}
