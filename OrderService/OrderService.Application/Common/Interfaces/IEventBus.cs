namespace OrderService.Application.Common.Interfaces;

public interface IEventBus
{
    Task PublishAsync<T>(T message, CancellationToken cancellationToken = default)
        where T : class;
    Task PublishAsync(object message, CancellationToken cancellationToken = default);
}