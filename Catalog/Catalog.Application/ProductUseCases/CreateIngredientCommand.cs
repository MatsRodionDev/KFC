using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Catalog.Domain.IngredientAggregate;
using Contracts.Mediator;
using Microsoft.AspNetCore.Http;

namespace Catalog.Application.ProductUseCases;

public record CreateIngredientCommand(
    string Name,
    decimal Price,
    int Weight,
    int Calories,
    List<ProductCategory> AvailableForProductCategories,
    IFormFile? Image) : ICommand<Guid>;

public sealed class CreateIngredientCommandHandler(
    IUnitOfWork unitOfWork,
    IS3Storage s3Storage) : ICommandHandler<CreateIngredientCommand, Guid>
{
    public async Task<Guid> Handle(CreateIngredientCommand command, CancellationToken cancellationToken)
    {
        var ingredient = Ingredient.Create(command.Name, command.Price, command.Weight, command.Calories);

        foreach (var category in command.AvailableForProductCategories)
        {
            ingredient.AddAvailableForProductCategory(category);
        }

        if (command.Image is not null)
        {
            var imageName = await s3Storage.UploadFileAsync(command.Image, cancellationToken);
            ingredient.AddImage(imageName);
        }
        
        await unitOfWork.IngredientRepository.AddAsync(ingredient, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return ingredient.Id;
    }
}

