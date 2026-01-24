using Contracts.Geo;

namespace Contracts.Order;

public record Delivery 
{
    public ServiceType ServiceType { get; set; } = ServiceType.ClickCollect;
    public AddressGeocodeResponse? Address { get; set; }
    public StoreInfo? StoreAddressInfo { get; set; }
}

public record Coordinates
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}