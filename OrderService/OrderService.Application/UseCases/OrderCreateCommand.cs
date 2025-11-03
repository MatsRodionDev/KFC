using Contracts.Cache;
using Contracts.Events;
using Contracts.Mediator;
using Contracts.Middlewares;
using Medallion.Threading;
using OrderService.Application.Common;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public record OrderCreateCommand(
    Guid UserId) : ICommand<Order>;

internal sealed class OrderCreateCommandHandler(IUnitOfWork unitOfWork,
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
        
        var menu = await cacheService.GetOrAddAsync("menu", 
            async () => await catalogClient.GetMenu(cancellationToken), cancellationToken);

        if (menu is null)
        {
            throw new Exception("Menu not found");
        }
        
        var errors = cart.Validate(menu);

        if (errors.Any())
        {
            await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
            throw new ValidationException { Errors = errors };
        }
        
        var order = cart.ToOrder();
        cart.Clear();

        await unitOfWork.OrderRepository.AddAsync(order, cancellationToken);
        var orderCreatedEvent = new OrderCreatedEvent(Guid.NewGuid(), order.ToContract());
        await unitOfWork.SaveChangesAsync([orderCreatedEvent], cancellationToken);
        
        return order;
    }
    
    protected override Guid? GetUserId(OrderCreateCommand command)
    {
        return command.UserId;
    }
}