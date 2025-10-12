using Catalog.Domain.ToppingAggregate;

namespace Catalog.Domain.Interfaces.Repositories
{
    public interface IToppingRepository
    {
        Task<Topping?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Topping>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task AddAsync(Topping topping, CancellationToken cancellationToken = default);
        void Update(Topping topping);
        void UpdateMany(List<Topping> toppings);
    }
}
