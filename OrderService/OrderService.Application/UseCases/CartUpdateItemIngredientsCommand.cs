using Contracts.Mediator;
using Medallion.Threading;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;

namespace OrderService.Application.UseCases;

public sealed record CartUpdateItemIngredientsCommand(
    string UserId,
    Guid ItemId,
    List<IngredientQuantityCustomization> IngredientsQuantityCustomizations) : ICommand<Guid>;


internal sealed class CartUpdateItemIngredientsCommandHandler(IUnitOfWork unitOfWork,
    IDistributedLockProvider distributedLockProvider) 
    : BaseCommandHandler<CartUpdateItemIngredientsCommand, Guid>(distributedLockProvider)
{
    protected override async Task<Guid> InternalHandle(CartUpdateItemIngredientsCommand command, CancellationToken cancellationToken)
    {
        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (cart.IsEmpty())
        {
            throw new Exception("Cart is Empty");
        }

        var item = cart.Items.FirstOrDefault(x => x.Id == command.ItemId);

        if (item == null)
        {
            throw new Exception("Item not found");
        }
        
        var ingredients = item.ItemIngredients.ToDictionary(i => i.IngredientId);

        foreach (var customization in command.IngredientsQuantityCustomizations)
        {
            if (!ingredients.TryGetValue(customization.IngredientId, out var ingredient))
            {
                throw new Exception($"Ingredient {customization.IngredientId} not found");
            }
            
            var newCustomQuantityDelta =  ingredient.CustomQuantityDelta + customization.Delta;

            if (newCustomQuantityDelta < ingredient.MinQuantity
                || newCustomQuantityDelta > ingredient.MaxQuantity)
            {
                throw new Exception("Insufficient ingredient quantity");
            }
            
            ingredient.CustomQuantityDelta = newCustomQuantityDelta;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        
        return item.Id;
    }

    protected override string? GetUserId(CartUpdateItemIngredientsCommand command)
    {
        return command.UserId;
    }
}
