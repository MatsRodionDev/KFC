using Catalog.Domain.IngredientAggregate;

namespace Catalog.Domain.Interfaces.Repositories
{
    public interface IIngredientRepository
    {
        Task<Ingredient?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Ingredient>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task AddAsync(Ingredient ingredient, CancellationToken cancellationToken = default);
        void Update(Ingredient ingredient);
        void UpdateMany(List<Ingredient> ingredients);
    }
}
