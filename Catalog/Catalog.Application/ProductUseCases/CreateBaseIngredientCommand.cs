using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Catalog.Domain.IngredientAggregate;
using Contracts.Mediator;
using Microsoft.AspNetCore.Http;

namespace Catalog.Application.ProductUseCases;

public record CreateBaseIngredientCommand(
    string Name,
    decimal Price,
    int Weight,
    int Calories,
    ProductCategory ForProductCategory,
    IFormFile? Image) : ICommand<Guid>;
    
public sealed class CreateBaseIngredientCommandHandler(
    IUnitOfWork unitOfWork,
    IS3Storage s3Storage) : ICommandHandler<CreateBaseIngredientCommand, Guid>
{
    public async Task<Guid> Handle(CreateBaseIngredientCommand command, CancellationToken cancellationToken)
    {
        var ingredient = Ingredient.CreateBase(command.Name, command.Price, command.Weight, command.Calories, command.ForProductCategory);
        
        if (command.Image is not null)
        {
            var fileName = await s3Storage.UploadFileAsync(command.Image, cancellationToken);
            ingredient.AddImage(fileName);
        }
        
        await unitOfWork.IngredientRepository.AddAsync(ingredient, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return ingredient.Id;
    }
}