using Catalog.Domain.ProductAggregate;

namespace Catalog.Domain.Repositories
{
    public interface IProductIngredientRepository
    {
        Task AddAsync(ProductIngredient productIngredient, CancellationToken cancellationToken = default);
    }
}
