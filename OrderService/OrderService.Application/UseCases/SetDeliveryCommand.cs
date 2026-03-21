using System.Net;
using Contracts.Cache;
using Contracts.Geo;
using Contracts.Mediator;
using Contracts.Restaurants;
using Medallion.Threading;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record SetDeliveryCommand(
    string UserId,
    ServiceType ServiceType,
    string? Address,
    Guid? StoreId) : ICommand<Guid>;

public sealed class SetDeliveryCommandHandler(
    IUnitOfWork unitOfWork,
    IGeoApiClient geoApiClient,
    IRestaurantClient restaurantClient,
    ICacheService cacheService,
    IDistributedLockProvider distributedLockProvider)
    : BaseCommandHandler<SetDeliveryCommand, Guid>(distributedLockProvider)
{
    protected override async Task<Guid> InternalHandle(SetDeliveryCommand command, CancellationToken cancellationToken)
    {
        var cart = await GetOrCreateCartAsync(command.UserId, cancellationToken);

        var result = command.ServiceType switch
        {
            ServiceType.ClickCollect => await SetClickCollectAsync(cart, command.StoreId, cancellationToken),
            
            ServiceType.Delivery => await SetDeliveryAsync(cart, command.Address, cancellationToken),
            
            _ => CommandResult.Failure($"Unsupported service type: {command.ServiceType}")
        };

        if (!result.IsSuccess)
            throw new InvalidOperationException(result.ErrorMessage);

        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        return cart.Id;
    }

    protected override string? GetUserId(SetDeliveryCommand command) => command.UserId;
    
    private async Task<Cart> GetOrCreateCartAsync(string userId, CancellationToken ct)
    {
        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(userId, ct);
        if (cart is not null)
            return cart;

        cart = new Cart { UserId = userId };
        await unitOfWork.CartRepository.AddAsync(cart, ct);
        return cart;
    }

    private async Task<CommandResult> SetClickCollectAsync(Cart cart, Guid? storeId, CancellationToken cancellationToken)
    {
        cart.Delivery.ServiceType = ServiceType.ClickCollect;
        cart.Delivery.Address = null;
        cart.Delivery.StoreAddressInfo = null;

        if (storeId is null)
        {
            return CommandResult.Failure("Store id is empty");
        }
        
        var store = await cacheService.GetOrAddAsync(storeId.ToString() ,GetRestaurant, cancellationToken);

        if (store is null)
        {
            return CommandResult.Failure("Store not found");
        }
        
        return await SetStoreInfoAsync(cart, store.Address);
        
        async Task<RestaurantResponse> GetRestaurant()
            => await restaurantClient.GetByIdAsync(storeId.Value, cancellationToken);
    }

    private async Task<CommandResult> SetDeliveryAsync(Cart cart, string? address, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(address))
            return CommandResult.Failure("Address cannot be empty");
        
        cart.Delivery.ServiceType = ServiceType.Delivery;

        var response = await geoApiClient.GetAddressInfoAsync(address);
        if (response.StatusCode != HttpStatusCode.OK || response.Content is null)
            return CommandResult.Failure("Address not found");

        var data = response.Content;
        cart.Delivery.ServiceType = ServiceType.Delivery;
        cart.Delivery.Address = new AddressInfo
        {
            Address = data.Address,
            Uri = data.Uri,
            Components = data.Components,
            Coordinates = data.Coordinates
        };

        var storesResponse = await geoApiClient.GetStoresInRadiusAsync(
            cart.Delivery.Address.Coordinates.Latitude,
            cart.Delivery.Address.Coordinates.Longitude);
        
        var stores = storesResponse.Content;

        if (stores is null || !stores.Any())
            return CommandResult.Failure("Delivery to this address is not available");

        return await SetStoreInfoAsync(cart, stores.First().Address);
    }

    private async Task<CommandResult> SetStoreInfoAsync(Cart cart, string storeAddress)
    {
        var storeResponse = await geoApiClient.GetStoreByAddressAsync(storeAddress);
        var store = storeResponse.Content;
        
        if (store is null)
        {
            return CommandResult.Failure("Delivery to this address is not available");
        }
        
        cart.Delivery.StoreAddressInfo = store;

        return CommandResult.Success();
    }

    private record CommandResult(bool IsSuccess, string? ErrorMessage)
    {
        public static CommandResult Success() => new(true, null);
        public static CommandResult Failure(string message) => new(false, message);
    }
}