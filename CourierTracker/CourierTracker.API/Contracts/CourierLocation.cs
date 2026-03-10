namespace CourierTracker.API.Contracts;

public class CourierLocation
{
    public Guid OrderId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}