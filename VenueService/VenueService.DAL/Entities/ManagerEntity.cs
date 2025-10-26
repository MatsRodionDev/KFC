using System.ComponentModel.DataAnnotations;

namespace VenueService.DAL.Entities;

public class ManagerEntity : BaseEntity
{
    [MaxLength(100)]
    public required string FirstName { get; set; }
    
    [MaxLength(100)]
    public required string LastName { get; set; }

    [MaxLength(100)]
    public required string Email { get; set; }

    public Guid RestaurantId { get; set; }

    public bool IsActive { get; set; } = true;

    public required RestaurantEntity Restaurant { get; set; }
}