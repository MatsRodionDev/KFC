using Catalog.Domain.DrinkAggregate;

namespace Catalog.Domain.Interfaces.Repositories
{
    public interface IDrinkRepository
    {
        Task<Drink?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Drink>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task AddAsync(Drink drink, CancellationToken cancellationToken = default);
        void Update(Drink drink);
        void UpdateMany(List<Drink> drinks);
    }
}
