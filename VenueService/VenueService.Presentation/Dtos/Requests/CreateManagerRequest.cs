namespace VenueService.Dtos.Requests;

public class CreateManagerRequest
{
    public required string FirstName { get; set; }
    
    public required string LastName { get; set; }
    
    public required string Email { get; set; }
    
    public required Guid RestaurantId { get; set; }
    
    public bool IsActive { get; set; } = true;
}

