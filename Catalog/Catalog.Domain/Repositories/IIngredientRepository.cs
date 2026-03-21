using Catalog.Domain.Enums;
using Catalog.Domain.IngredientAggregate;

namespace Catalog.Domain.Interfaces.Repositories
{
    public interface IIngredientRepository
    {
        Task<Ingredient?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Ingredient>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task<(List<Ingredient> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            string? name,
            bool? isBase,
            ProductCategory? forProductCategory,
            CancellationToken cancellationToken = default);
        Task AddAsync(Ingredient ingredient, CancellationToken cancellationToken = default);
        Task<List<Ingredient>> GetByCategoryAsync(ProductCategory category, CancellationToken cancellationToken = default);
        void Update(Ingredient ingredient);
        void UpdateMany(List<Ingredient> ingredients);
    }
}
