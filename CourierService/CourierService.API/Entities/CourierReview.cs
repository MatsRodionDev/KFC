namespace CourierService.API.Entities;

public class CourierReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourierId { get; set; }
    public Courier Courier { get; set; } = null!;

    /// <summary>ID заказа из OrderService — для защиты от повторных отзывов.</summary>
    public Guid OrderId { get; set; }

    /// <summary>Оценка от 1 до 5.</summary>
    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
