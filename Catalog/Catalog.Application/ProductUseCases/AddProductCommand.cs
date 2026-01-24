using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Catalog.Domain.Services;
using Contracts.Mediator;
using Microsoft.AspNetCore.Http;

namespace Catalog.Application.ProductUseCases;

public record AddProductCommand(
    string Name, 
    string Description, 
    decimal? Price,
    ProductCategory ProductCategory,
    IngredientSnapshot? BaseIngredient,
    List<IngredientSnapshot> Ingredients,
    IFormFile? Image) : ICommand<Guid>;

public sealed class AddProductCommandHandler(IUnitOfWork unitOfWork,
    ProductAdditionService productAdditionService,
    IS3Storage s3Storage) : ICommandHandler<AddProductCommand, Guid>
{
    public async Task<Guid> Handle(AddProductCommand command, CancellationToken cancellationToken)
    {
        var product = await productAdditionService.Add(
            command.Name, 
            command.Description, 
            command.Price, 
            command.ProductCategory, 
            command.BaseIngredient, 
            command.Ingredients, 
            cancellationToken);

        if (command.Image is not null)
        {
            var fileName = await s3Storage.UploadFileAsync(command.Image, cancellationToken);
            product.AddImage(fileName);
        }
        
        await unitOfWork.ProductRepository.AddAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return product.Id;
    }
}
    