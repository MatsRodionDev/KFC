using Shop.Domain.ProductAggregate;

namespace Shop.Domain.Interfaces.Repositories
{
    public interface IIngredientRepository
    {
        Task<Ingredient> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Ingredient>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
    }
}
