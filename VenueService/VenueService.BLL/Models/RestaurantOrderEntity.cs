using Contracts.Order;

namespace VenueService.BLL.Models;

public class RestaurantOrderModel : BaseModel
{
    public Guid OrderId { get; set; }

    public Guid RestaurantId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public OrderStatus Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public required RestaurantModel Restaurant { get; set; }
}