using System.Text.Json;
using Contracts.Courier;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;

namespace CourierTracker.API.Hubs;

public interface ICourierLocationNotification
{
    Task CourierLocationChanged(CourierLocation courierLocation);
}

public class TrackerHub(IDistributedCache cache) : Hub<ICourierLocationNotification>
{
    public async Task ConnectToOrderTracker(Guid orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, orderId.ToString());

        try
        {
            var courierLocationStr = await cache.GetStringAsync(orderId.ToString());
            var courierLocation = courierLocationStr is not null 
                ? JsonSerializer.Deserialize<CourierLocation>(courierLocationStr)
                : null;
        
            if (courierLocation is not null)
            {
                await Clients.Caller.CourierLocationChanged(courierLocation);
            }
        }
        catch (Exception _)
        {
            // ignored
        }
    }
}
