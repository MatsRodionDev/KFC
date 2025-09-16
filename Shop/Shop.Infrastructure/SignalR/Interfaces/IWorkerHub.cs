using Shop.Domain.OrderAggregate;

namespace Shop.Infrastructure.SignalR.Interfaces
{
    public interface IWorkerHub
    {
        public Task ReceiveNewOrderAsync(string s);
    }
}
