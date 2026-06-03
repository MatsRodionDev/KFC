namespace CourierService.API.Entities;

/// <summary>Снимок заказа и локальный статус workflow курьерского приложения.</summary>
public class CourierOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourierId { get; set; }
    public Courier Courier { get; set; } = null!;

    public Guid OrderId { get; set; }
    public string Status { get; set; } = "new";

    public string ClientName { get; set; } = "";
    public string ClientPhone { get; set; } = "";
    public string AddressA { get; set; } = "";
    public string AddressB { get; set; } = "";
    public decimal Price { get; set; }
    public string Distance { get; set; } = "";

    public double PickupLatitude { get; set; }
    public double PickupLongitude { get; set; }
    public double DestinationLatitude { get; set; }
    public double DestinationLongitude { get; set; }

    /// <summary>JSON: [{ "id", "name", "quantity" }]</summary>
    public string ItemsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
