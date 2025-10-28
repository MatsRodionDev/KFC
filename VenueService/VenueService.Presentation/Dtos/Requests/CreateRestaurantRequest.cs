namespace VenueService.Dtos.Requests;

public class CreateRestaurantRequest
{
    public required string Name { get; set; }
    
    public required double Latitude { get; set; }
    
    public required double Longitude { get; set; }
    
    public bool IsActive { get; set; } = true;
}

