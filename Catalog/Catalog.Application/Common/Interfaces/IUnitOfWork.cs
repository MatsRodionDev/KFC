using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.Repositories;

namespace Catalog.Application.Common.Interfaces;

public interface IUnitOfWork
{
    IProductRepository ProductRepository { get; }
    IIngredientRepository IngredientRepository { get; }
    IToppingRepository ToppingRepository { get; }
    IProductIngredientRepository  ProductIngredientRepository { get; }
    IDrinkRepository DrinkRepository { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}