using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Catalog.Domain.Services;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public record AddCustomProductCommand(
    string Name, 
    string Description, 
    Guid UserId,
    ProductCategory ProductCategory,
    IngredientSnapshot BaseIngredient,
    List<IngredientSnapshot> Ingredients) : ICommand<Guid>;

internal sealed class AddCustomProductCommandHandler(IUnitOfWork unitOfWork,
    ProductAdditionService productAdditionService) :  ICommandHandler<AddCustomProductCommand, Guid>
{
    public async Task<Guid> Handle(AddCustomProductCommand command, CancellationToken cancellationToken)
    {
        var product = await productAdditionService.AddCustom(
            command.Name, 
            command.Description, 
            command.ProductCategory, 
            command.BaseIngredient, 
            command.Ingredients, 
            command.UserId,
            cancellationToken);
        
        await unitOfWork.ProductRepository.AddAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return product.Id;
    }
}