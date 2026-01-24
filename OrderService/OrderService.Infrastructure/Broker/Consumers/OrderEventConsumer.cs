using Contracts.Events;
using Contracts.Mediator;
using MassTransit;
using OrderService.Application.UseCases;
using OrderService.Infrastructure.Workflows;
using Temporalio.Client;

namespace OrderService.Infrastructure.Broker.Consumers;

public class OrderEventConsumer(ITemporalClient client) : IConsumer<OrderEvent>
{
    public async Task Consume(ConsumeContext<OrderEvent> context)
    {
        var orderEvent = context.Message;
        var command = new OrderEventCommand(
            orderEvent.EventId, 
            orderEvent.OrderId, 
            orderEvent.EventType, 
            orderEvent.OccuredAt);
        
        await client.SignalAsync<OrderWorkflow>(orderEvent.OrderId, w => w.OrderEvent(orderEvent));
    }
}