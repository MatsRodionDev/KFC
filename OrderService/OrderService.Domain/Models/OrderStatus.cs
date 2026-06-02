namespace OrderService.Domain.Models;

public enum OrderStatus
{
    Created,
    Paid,
    Cooking,
    Ready,
    Shipped,
    Cancelled,
    Delivered  // Курьер подтвердил доставку клиенту (фото + CV)
}
