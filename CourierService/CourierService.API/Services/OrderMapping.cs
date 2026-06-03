using System.Text.Json;
using CourierService.API.Entities;
using CourierService.API.Models;

namespace CourierService.API.Services;

public static class OrderMapping
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static CourierOrderDto ToDto(CourierOrder o) => new(
        o.Id,
        o.OrderId.ToString(),
        o.ClientName,
        o.ClientPhone,
        o.AddressA,
        o.AddressB,
        o.Price,
        o.Distance,
        o.Status,
        o.PickupLatitude,
        o.PickupLongitude,
        o.DestinationLatitude,
        o.DestinationLongitude,
        DeserializeItems(o.ItemsJson),
        o.CreatedAt,
        o.CompletedAt);

    public static void ApplySnapshot(CourierOrder entity, SaveCourierOrderRequest req)
    {
        entity.OrderId = Guid.Parse(req.OrderId);
        entity.ClientName = req.ClientName;
        entity.ClientPhone = req.ClientPhone;
        entity.AddressA = req.AddressA;
        entity.AddressB = req.AddressB;
        entity.Price = req.Price;
        entity.Distance = req.Distance;
        entity.Status = req.Status;
        entity.PickupLatitude = req.PickupLatitude;
        entity.PickupLongitude = req.PickupLongitude;
        entity.DestinationLatitude = req.DestinationLatitude;
        entity.DestinationLongitude = req.DestinationLongitude;
        entity.ItemsJson = JsonSerializer.Serialize(req.Items ?? [], JsonOpts);
        entity.UpdatedAt = DateTime.UtcNow;
        if (req.Status == "delivered")
            entity.CompletedAt ??= DateTime.UtcNow;
    }

    private static List<CourierOrderItemDto> DeserializeItems(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<CourierOrderItemDto>>(json, JsonOpts) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
