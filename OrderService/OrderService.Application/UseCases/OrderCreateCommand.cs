using Contracts.Cache;
using Contracts.Mediator;
using Contracts.Middlewares;
using Contracts.Product;
using Medallion.Threading;
using OrderService.Application.Common;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public record OrderCreateCommand(
    string UserId) : ICommand<Order>;

internal sealed class OrderCreateCommandHandler(IUnitOfWork unitOfWork,
    ITemporalService temporalService,
    IDistributedLockProvider distributedLockProvider,
    ICatalogClient catalogClient,
    ICacheService cacheService) 
    : BaseCommandHandler<OrderCreateCommand, Order>(distributedLockProvider)
{
    protected override async Task<Order> InternalHandle(OrderCreateCommand command, CancellationToken cancellationToken)
    {
        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (cart is null || cart.IsEmpty())
        {
            throw new Exception("Cart is empty");
        }

        var (commonMenu, customProducts) = await GetMenuAsync(cart, cancellationToken);
        await ValidateAsync(cart, commonMenu, customProducts, cancellationToken);
        
        var order = cart.ToOrder();
        order.Payment = new Payment
        {
            OrderId = order.Id,
            AmountTotal = order.TotalPrice
        };
        cart.Clear();

        await unitOfWork.OrderRepository.AddAsync(order, cancellationToken);
        // var orderCreatedEvent = new OrderCreatedEvent(Guid.NewGuid(), order.ToContract());
        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        await temporalService.StartOrderWorkFlowAsync(order.Id, command.UserId);
        
        return order;
    }
    
    protected override string? GetUserId(OrderCreateCommand command)
    {
        return command.UserId;
    }

    private async Task<(MenuResponse?, List<ProductResponse>)> GetMenuAsync(Cart cart, CancellationToken cancellationToken)
    {
        var getMenuTask = cacheService.GetOrAddAsync("menu", 
            async () => await catalogClient.GetMenu(cancellationToken), cancellationToken);

        if (!HasCustomProducts(cart))
        {
            var menu = await getMenuTask;
            return (menu, new List<ProductResponse>());
        }

        var getCustomProductsTask = catalogClient.GetCustomProducts(cart.UserId, cancellationToken);
        await Task.WhenAll(getMenuTask, getCustomProductsTask);
    
        var menuResult = await getMenuTask;
        var customProducts = await getCustomProductsTask;
    
        return (menuResult, customProducts);
    }
    
    private static bool HasCustomProducts(Cart cart)
    {
        return cart.Items.Any(i => i.UserId is not null);
    }

    private async Task ValidateAsync(Cart cart, 
        MenuResponse? menu, 
        List<ProductResponse> customProducts,
        CancellationToken cancellationToken)
    {
        if (menu is null)
        {
            throw new Exception("Menu not found");
        }
        
        var (errors, itemsToRemove) = cart.Validate(menu, customProducts);

        if (errors.Any() || itemsToRemove.Any())
        {
            foreach (var item in itemsToRemove)
                cart.Items.Remove(item);
            
            await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
            throw new ValidationException { Errors = errors };
        }
    }
}