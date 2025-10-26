namespace VenueService.BLL.Models;

public class ManagerModel : BaseModel
{
    public required string FirstName { get; set; }
    
    public required string LastName { get; set; }

    public required string Email { get; set; }

    public Guid RestaurantId { get; set; }

    public bool IsActive { get; set; } = true;

    public required RestaurantModel Restaurant { get; set; }
}