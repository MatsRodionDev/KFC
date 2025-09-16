using Shop.Domain.OrderAggregate;

namespace Shop.Application.Common.Interfaces.Notifiers
{
    public interface IWorkerNotifier
    {
        Task NotifyNewOrderAsync(Order order, CancellationToken cancellationToken = default);
    }
}
