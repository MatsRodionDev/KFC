using Microsoft.AspNetCore.SignalR;
using Shop.Application.Common.Interfaces.Notifiers;
using Shop.Domain.OrderAggregate;
using Shop.Infrastructure.SignalR.Interfaces;

namespace Shop.Infrastructure.SignalR
{
    internal class SignalRWorkerNotifier(IHubContext<WorkerHub, IWorkerHub> hubContext) : IWorkerNotifier
    {
        public async Task NotifyNewOrderAsync(Order order, CancellationToken cancellationToken = default)
        {
            await hubContext.Clients.All.ReceiveNewOrderAsync("Привет");
        }
    }
}
