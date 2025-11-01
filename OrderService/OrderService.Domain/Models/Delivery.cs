namespace OrderService.Domain.Models;

public record Delivery 
{
    public ServiceType ServiceType { get; set; } = ServiceType.ClickCollect;
    public string? Address { get; set; }
    public Coordinates? Coordinates { get; set; }
}

public record Coordinates
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}