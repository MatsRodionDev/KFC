using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Catalog.Domain.Services;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public record AddProductCommand(
    string Name, 
    string Description, 
    decimal? Price,
    ProductCategory ProductCategory,
    IngredientSnapshot? BaseIngredient,
    List<IngredientSnapshot> Ingredients) : ICommand<Guid>;

public sealed class AddProductCommandHandler(IUnitOfWork unitOfWork,
    ProductAdditionService productAdditionService) : ICommandHandler<AddProductCommand, Guid>
{
    public async Task<Guid> Handle(AddProductCommand request, CancellationToken cancellationToken)
    {
        var product = await productAdditionService.Add(
            request.Name, 
            request.Description, 
            request.Price, 
            request.ProductCategory, 
            request.BaseIngredient, 
            request.Ingredients, 
            cancellationToken);
        
        await unitOfWork.ProductRepository.AddAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return product.Id;
    }
}
    