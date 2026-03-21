using Shop.Domain.Enums;
using Catalog.Domain.DrinkAggregate;

namespace Catalog.Domain.Interfaces.Repositories
{
    public interface IDrinkRepository
    {
        Task<Drink?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<Drink>> GetByIdsAsync(List<Guid> ids, CancellationToken cancellationToken = default);
        Task<(List<Drink> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            string? name,
            string? description,
            DrinkType? type,
            CancellationToken cancellationToken = default);
        Task<List<Drink>> GetAllAsync(CancellationToken cancellationToken = default);
        Task AddAsync(Drink drink, CancellationToken cancellationToken = default);
        void Update(Drink drink);
        void UpdateMany(List<Drink> drinks);
    }
}
