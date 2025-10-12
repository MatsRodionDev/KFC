using Medallion.Threading;
using OrderService.Application.Common;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Application.Common.Mappers;
using OrderService.Application.Common.Mediator;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record CartAddProductItemCommand(
    Guid UserId,
    Guid ProductId,
    int Quantity,
    List<IngredientQuantityCustomization> IngredientsQuantityCustomizations) : ICommand<Guid>;

public sealed record IngredientQuantityCustomization(Guid IngredientId, int Delta);

internal sealed class CartAddProductItemCommandHandler(IUnitOfWork unitOfWork,
    ICatalogClient catalogClient,
    ICacheService cacheService,
    IDistributedLockProvider distributedLockProvider) 
    : BaseCommandHandler<CartAddProductItemCommand, Guid>(distributedLockProvider)
{
    protected override async Task<Guid> InternalHandle(CartAddProductItemCommand command, CancellationToken cancellationToken)
    {
        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (cart is null)
        {
            cart = new Cart { UserId = command.UserId };
            await unitOfWork.CartRepository.AddAsync(cart, cancellationToken);
        }
        
        var productResponse = await cacheService.GetOrAddAsync(command.ProductId.ToString(), 
            async () => await catalogClient.GetCartItem(command.ProductId, cancellationToken), cancellationToken);

        if (productResponse is null)
        {
            throw new Exception($"Could not find product with id: {command.ProductId}");
        }
        
        var cartItem = productResponse.ToCartItem(command.UserId);
        
        Guid cartItemId;
        var existingItem = cart.Items.FirstOrDefault(i => i.EqualToItem(cartItem));
        
        if (existingItem is null)
        {
            cartItem.Quantity = command.Quantity;
            AddCustomizations(cartItem, command.IngredientsQuantityCustomizations);
            cart.Items.Add(cartItem);
            
            await unitOfWork.CartItemRepository.AddAsync(cartItem, cancellationToken);
            
            cartItemId = cartItem.Id;
        }
        else
        {
            existingItem.Quantity += command.Quantity;
            
            cartItemId = existingItem.Id;
        }
        
        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        
        return cartItemId;
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

    protected override Guid? GetUserId(CartAddProductItemCommand command)
    {
        return command.UserId;
    }
}
