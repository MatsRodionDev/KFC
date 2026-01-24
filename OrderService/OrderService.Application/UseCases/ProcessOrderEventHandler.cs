using Contracts.Events;
using Contracts.Mediator;
using OrderService.Application.Common;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public record OrderEventCommand(Guid EventId, Guid OrderId, EventType EventType, DateTime OccuredAt) 
    : OrderEvent(EventId, OrderId, EventType, OccuredAt), ICommand<bool>;

public class ProcessOrderEventHandler(IUnitOfWork unitOfWork) : ICommandHandler<OrderEventCommand, bool>
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
                if (order.Payment.Paid)
                {
                    order.Status = OrderStatus.Paid;
                    var vduEvent = new SendOrderToVduEvent(Guid.NewGuid(), order.ToContract());
                    await unitOfWork.SaveChangesAsync([vduEvent], cancellationToken);
                    
                    return true;
                }
                return false;
        }
        
        return false;
    }
}