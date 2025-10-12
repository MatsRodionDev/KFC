using MassTransit;
using OrderService.Application.Common.Interfaces;

namespace OrderService.Infrastructure.Broker;

public class EventBus(IBus bus) : IEventBus
{
    public async Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) 
        where T : class =>
        await bus.Publish(message, cancellationToken);

    public async Task PublishAsync(object message, CancellationToken cancellationToken = default) =>
        await bus.Publish(message, message.GetType(), cancellationToken);
}