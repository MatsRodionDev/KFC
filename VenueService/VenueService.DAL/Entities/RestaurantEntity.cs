using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;

namespace VenueService.DAL.Entities;

public class RestaurantEntity : BaseEntity
{
    [MaxLength(100)]
    public required string Name { get; set; }

    public required Point Location { get; set; }

    public bool IsActive { get; set; } = true;

    public List<RestaurantOrderEntity> Orders { get; set; } = [];
    
    public List<ManagerEntity> Managers { get; set; } = [];
}