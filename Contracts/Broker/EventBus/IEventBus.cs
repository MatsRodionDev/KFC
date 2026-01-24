namespace Contracts.Broker.EventBus;

public interface IEventBus
{
    Task PublishAsync<T>(T message, CancellationToken cancellationToken = default)
        where T : class;
    Task PublishAsync(object message, CancellationToken cancellationToken = default);
}