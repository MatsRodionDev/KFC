namespace Contracts.Restaurants;

public class RestaurantResponse
{
    public Guid Id { get; set; }
    
    public required string Name { get; set; }

    public string Address { get; set; }
    
    public required double Latitude { get; set; }
    
    public required double Longitude { get; set; }
    
    public bool IsActive { get; set; }
}