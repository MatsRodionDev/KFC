using Contracts.Geo;

namespace OrderService.Domain.Models;

public record Delivery 
{
    public ServiceType ServiceType { get; set; } = ServiceType.ClickCollect;
    public AddressInfo? Address { get; set; }
    public StoreInfo? StoreAddressInfo { get; set; }
}

public class AddressInfo : AddressGeocodeResponse;

public class StoreAddressInfo : GeoStoreResponse;

public record Coordinates
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}