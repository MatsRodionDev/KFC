namespace VenueService.Dtos.Responses;

public class ManagerResponse
{
    public Guid Id { get; set; }
    
    public required string FirstName { get; set; }
    
    public required string LastName { get; set; }
    
    public required string Email { get; set; }
    
    public Guid RestaurantId { get; set; }
    
    public bool IsActive { get; set; }
    
    //public RestaurantResponse? Restaurant { get; set; }
}

