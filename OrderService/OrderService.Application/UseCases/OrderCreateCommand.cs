using Contracts.Events;
using Contracts.Mediator;
using Medallion.Threading;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public record OrderCreateCommand(
    Guid UserId) : ICommand<Order>;

internal sealed class OrderCreateCommandHandler(IUnitOfWork unitOfWork,
    IDistributedLockProvider distributedLockProvider) 
    : BaseCommandHandler<OrderCreateCommand, Order>(distributedLockProvider)
{
    protected override async Task<Order> InternalHandle(OrderCreateCommand command, CancellationToken cancellationToken)
    {
        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (cart is null || cart.IsEmpty())
        {
            throw new Exception("Cart is empty");
        }
        
        var order = cart.ToOrder();
        
        cart.Items.Clear();

        await unitOfWork.OrderRepository.AddAsync(order, cancellationToken);
        var orderCreatedEvent = new OrderCreatedEvent(Guid.NewGuid(), order.ToContract());
        await unitOfWork.SaveChangesAsync([orderCreatedEvent], cancellationToken);
        
        return order;
    }
}