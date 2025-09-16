using Microsoft.AspNetCore.SignalR;
using Shop.Infrastructure.SignalR.Interfaces;

namespace Shop.Infrastructure.SignalR
{
    public class WorkerHub : Hub<IWorkerHub>
    {
    }
}
