using Catalog.Application.Common.Interfaces;
using Catalog.Application.Common.Mediator;
using Catalog.Domain.DrinkAggregate;
using Catalog.Domain.Exceptions;
using Catalog.Domain.Services;
using Shop.Domain.Enums;

namespace Catalog.Application.ProductUseCases;

public sealed record AddDrinkCommand(
    string Name,
    string Description,
    decimal Price,
    DrinkType DrinkType,
    List<Guid> ToppingsIds) : ICommand<Guid>;

internal sealed class AddDrinkCommandHandler(IUnitOfWork unitOfWork, 
    ToppingToDrinkAdditionService toppingToDrinkAdditionService) : ICommandHandler<AddDrinkCommand, Guid>
{
    public async Task<Guid> Handle(AddDrinkCommand command, CancellationToken cancellationToken)
    {
        var drink = Drink.Create(
            command.Name,
            command.Description,
            command.Price,
            command.DrinkType);

        await toppingToDrinkAdditionService.AddToppings(drink, command.ToppingsIds, cancellationToken);
        
        await unitOfWork.DrinkRepository.AddAsync(drink, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return drink.Id;
    }
}