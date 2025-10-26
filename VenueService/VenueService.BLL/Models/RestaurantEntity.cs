using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;

namespace VenueService.BLL.Models;

public class RestaurantModel : BaseModel
{
    [MaxLength(100)]
    public required string Name { get; set; }

    public required Point Location { get; set; }

    public bool IsActive { get; set; } = true;

    public List<RestaurantOrderModel> Orders { get; set; } = [];
    
    public List<ManagerModel> Managers { get; set; } = [];
}