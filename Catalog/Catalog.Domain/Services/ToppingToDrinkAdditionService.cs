using Catalog.Domain.DrinkAggregate;
using Catalog.Domain.Exceptions;
using Catalog.Domain.Interfaces.Repositories;

namespace Catalog.Domain.Services;

public sealed class ToppingToDrinkAdditionService(IToppingRepository toppingRepository)
{
    public async Task AddToppings(Drink drink, List<Guid> toppingsIds, CancellationToken cancellationToken)
    {
        var toppingsDictionary = (await toppingRepository
            .GetByIdsAsync(toppingsIds, cancellationToken)).ToDictionary(x => x.Id);

        foreach (var toppingId in toppingsIds)
        {
            if (!toppingsDictionary.TryGetValue(toppingId, out var topping))
            {
                throw new DomainException($"Topping with id: {toppingId} does not exist");
            }
            
            drink.AddTopping(topping);
        }
    }
}