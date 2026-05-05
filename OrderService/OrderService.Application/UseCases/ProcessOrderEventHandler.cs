using Contracts.Events;
using Contracts.Mediator;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public record OrderEventCommand(Guid EventId, Guid OrderId, EventType EventType, DateTime OccuredAt) 
    : OrderEvent(EventId, OrderId, EventType, OccuredAt), ICommand<bool>;

public class ProcessOrderEventHandler(IUnitOfWork unitOfWork, IOrderStatusService orderStatusService) : ICommandHandler<OrderEventCommand, bool>
{
    public async Task<bool> Handle(OrderEventCommand command, CancellationToken cancellationToken)
    {
        var order = await unitOfWork.OrderRepository.GetByIdAsync(command.OrderId, cancellationToken);

        if (order is null)
        {
            return false;
        }

        switch (command.EventType)
        {
            case EventType.OrderPaid:
                if (!order.Payment.Paid) 
                    return false;
                
                order.Status = OrderStatus.Paid;
                var vduEvent = new SendOrderToVduEvent(Guid.NewGuid(), order.ToContract());
                await unitOfWork.SaveChangesAsync([vduEvent], cancellationToken);
                    
                break;
            
            case EventType.OrderCooking:
                if (order.Status != OrderStatus.Paid)
                    return false;
                
                order.Status = OrderStatus.Cooking;
                
                var courierEvent = new SendOrderToCourierEvent(Guid.NewGuid(), order.ToContract());
                await unitOfWork.SaveChangesAsync(events: order.Delivery.ServiceType is ServiceType.Delivery ? [courierEvent] : [], cancellationToken: cancellationToken);
                break;
            
            case EventType.OrderReady:
                if (order.Status != OrderStatus.Cooking)
                    return false;
                
                order.Status = OrderStatus.Ready;
                var readyEvent = new OrderReadyToCourierEvent(Guid.NewGuid(), order.ToContract());
                await unitOfWork.SaveChangesAsync(events: order.Delivery.ServiceType is ServiceType.Delivery ?  [readyEvent] : [], cancellationToken: cancellationToken);
            break;
            
            case EventType.OrderPickedUp:
                if (order.Status != OrderStatus.Ready)
                    return false;
                
                order.Status = OrderStatus.InDelivery;
                var pickedUpEvent = new OrderCourierPickedUpEvent(Guid.NewGuid(), order.ToContract());
                await unitOfWork.SaveChangesAsync(events: order.Delivery.ServiceType is ServiceType.Delivery ?  [pickedUpEvent] : [], cancellationToken: cancellationToken);
            break;
            
            case EventType.OrderCollected:
                if ((order.Delivery.ServiceType is not ServiceType.Delivery
                     && order.Status != OrderStatus.InDelivery)
                    || (order.Delivery.ServiceType is not ServiceType.ClickCollect
                        && order.Status != OrderStatus.Ready))
                    return false;
                
                order.Status = OrderStatus.InDelivery;
                await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
            break;
            
            case EventType.OrderCookingExpired:
                if (order.Status is not OrderStatus.Cooking)
                    return false;
                order.Status = OrderStatus.Cancelled;
                await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
                break;
            
            default:
                return false;
        }
        
        await orderStatusService.OrderStatusChanged(order.UserId,
            new OrderSummaryDto(order.Id, order.Delivery.ServiceType, order.Status));
        
        return true;
    }
}
