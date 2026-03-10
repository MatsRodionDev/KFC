using Contracts.Cache;
using Contracts.Mediator;
using Medallion.Threading;
using OrderService.Application.Common;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Application.Common.Mappers;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record CartUpdateItemCommand(
    string UserId,
    Guid ItemId,
    int Delta) : ICommand<Guid>;


internal sealed class CartUpdateItemCommandHandler(IUnitOfWork unitOfWork,
    ICatalogClient catalogClient,
    ICacheService cacheService,
    IDistributedLockProvider distributedLockProvider) 
    : BaseCommandHandler<CartUpdateItemCommand, Guid>(distributedLockProvider)
{
    protected override async Task<Guid> InternalHandle(CartUpdateItemCommand command, CancellationToken cancellationToken)
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

        var newQuantity = item.Quantity + command.Delta;

        switch (newQuantity)
        {
            case > 0:
                item.Quantity = newQuantity;
                break;
            case 0:
                cart.Items.Remove(item);
                break;
            case < 0:
                throw new Exception("Quantity cannot be negative");
        }

        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        
        return item.Id;
    }

    private static void AddCustomizations(CartItem cartItem, 
        List<IngredientQuantityCustomization> ingredientsQuantityCustomizations)
    {
        foreach (var ingredientQuantityCustomization in ingredientsQuantityCustomizations)
        {
            var ingredient = cartItem.ItemIngredients
                .FirstOrDefault(i => i.IngredientId == ingredientQuantityCustomization.IngredientId);

            if (ingredient is null)
            {
                throw new Exception($"Ingredient {ingredientQuantityCustomization.IngredientId} not found");
            }
            
            var ingredientQuantityDelta = ingredientQuantityCustomization.Delta;

            if (ingredientQuantityDelta + ingredient.Quantity > ingredient.MaxQuantity
                || ingredientQuantityDelta + ingredient.Quantity < ingredient.MinQuantity)
            {
                throw new Exception("Insufficient ingredient quantity");
            }
            
            ingredient.CustomQuantityDelta += ingredientQuantityDelta;
        }
    }

    protected override string? GetUserId(CartUpdateItemCommand command)
    {
        return command.UserId;
    }
}
