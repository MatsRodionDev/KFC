using Catalog.Application.Common.Interfaces;
using Catalog.Domain.DrinkAggregate;
using Catalog.Domain.Services;
using Contracts.Mediator;
using Microsoft.AspNetCore.Http;
using Shop.Domain.Enums;

namespace Catalog.Application.ProductUseCases;

public sealed record AddDrinkCommand(
    string Name,
    string Description,
    decimal Price,
    DrinkType DrinkType,
    List<Guid> ToppingsIds,
    IFormFile? Image) : ICommand<Guid>;

internal sealed class AddDrinkCommandHandler(
    IUnitOfWork unitOfWork, 
    IS3Storage s3Storage,
    ToppingToDrinkAdditionService toppingToDrinkAdditionService) : ICommandHandler<AddDrinkCommand, Guid>
{
    public async Task<Guid> Handle(AddDrinkCommand command, CancellationToken cancellationToken)
    {
        var drink = Drink.Create(
            command.Name,
            command.Description,
            command.Price,
            command.DrinkType);

        var toppingIds = command.ToppingsIds ?? [];
        await toppingToDrinkAdditionService.AddToppings(drink, toppingIds, cancellationToken);
        
        if (command.Image is not null)
        {
            var fileName = await s3Storage.UploadFileAsync(command.Image, cancellationToken);
            drink.AddImage(fileName);
        }
        
        await unitOfWork.DrinkRepository.AddAsync(drink, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return drink.Id;
    }
}