using Contracts.Order;

namespace VenueService.DAL.Entities;

public class RestaurantOrderEntity : BaseEntity
{
    public Guid OrderId { get; set; }

    public Guid RestaurantId { get; set; }

    public Guid UserId { get; set; }

    public OrderStatus Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public required RestaurantEntity Restaurant { get; set; }
}