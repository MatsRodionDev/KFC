namespace VenueService.Dtos.Responses;

public class RestaurantResponse
{
    public Guid Id { get; set; }
    
    public required string Name { get; set; }
    
    public required double Latitude { get; set; }
    
    public required double Longitude { get; set; }
    
    public bool IsActive { get; set; }
}

