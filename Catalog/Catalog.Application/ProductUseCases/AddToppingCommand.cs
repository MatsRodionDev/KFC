using Catalog.Application.Common.Interfaces;
using Catalog.Domain.ToppingAggregate;
using Contracts.Mediator;
using Microsoft.AspNetCore.Http;
using Shop.Domain.Enums;

namespace Catalog.Application.ProductUseCases;

public sealed record AddToppingCommand(
    string Name,
    decimal Price,
    List<DrinkType> AvailableForTypes,
    IFormFile? Image) : ICommand<Guid>;

internal sealed class AddToppingCommandHandler(
    IUnitOfWork unitOfWork,
    IS3Storage s3Storage) : ICommandHandler<AddToppingCommand, Guid>
{
    public async Task<Guid> Handle(AddToppingCommand command, CancellationToken cancellationToken)
    {
        var topping = Topping.Create(
            command.Name, 
            command.Price, 
            command.AvailableForTypes);
        
        if (command.Image is not null)
        {
            var fileName = await s3Storage.UploadFileAsync(command.Image, cancellationToken);
            topping.AddImage(fileName);
        }
        
        await unitOfWork.ToppingRepository.AddAsync(topping, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return topping.Id;      
    }
}