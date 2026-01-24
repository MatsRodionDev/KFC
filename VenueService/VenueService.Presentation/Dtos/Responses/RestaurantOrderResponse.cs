using Contracts.Order;

namespace VenueService.Dtos.Responses;

public class RestaurantOrderResponse
{
    public Guid Id { get; set; }
    
    public Guid OrderId { get; set; }
    
    public Guid RestaurantId { get; set; }
    
    public Guid UserId { get; set; }
    
    public OrderStatus Status { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    //public RestaurantResponse? Restaurant { get; set; }
}

