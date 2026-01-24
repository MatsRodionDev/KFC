using Contracts.Events;
using Contracts.Mediator;
using OrderService.Application.UseCases;
using Temporalio.Activities;

namespace OrderService.Infrastructure.Workflows;

public class ProcessOrderEventActivity(IDispatcher dispatcher)
{
    [Activity]
    public async Task<bool> ProcessOrderEventAsync(OrderEvent orderEvent)
    {
        var command = new OrderEventCommand(orderEvent.EventId, orderEvent.OrderId, orderEvent.EventType, orderEvent.OccuredAt);
        return await dispatcher.Dispatch(command, CancellationToken.None);
    }
}