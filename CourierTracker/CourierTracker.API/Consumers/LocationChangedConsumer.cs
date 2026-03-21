using System.Text.Json;
using CourierTracker.API.Contracts;
using CourierTracker.API.Hubs;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;

namespace CourierTracker.API.Consumers;

public class LocationChangedConsumer(
    IDistributedCache cache,
    IHubContext<TrackerHub, ICourierLocationNotification> hubContext) : IConsumer<CourierLocation>
{
    public async Task Consume(ConsumeContext<CourierLocation> context)
    {
        var courierLocation = context.Message;
        
        await cache.SetStringAsync(courierLocation.OrderId.ToString(), 
            JsonSerializer.Serialize(courierLocation),
            new DistributedCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(3)));
        
        await hubContext.Clients
            .Group(courierLocation.OrderId.ToString())
            .CourierLocationChanged(courierLocation);
    }
}