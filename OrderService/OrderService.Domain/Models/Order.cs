namespace OrderService.Domain.Models;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public OrderStatus Status { get; set; }
    public Delivery Delivery { get; set; }
    public Payment Payment { get; set; }
    public List<OrderItem> Items { get; set; } = [];

    /// <summary>
    /// Одноразовый QR-токен для подтверждения получения заказа курьером.
    /// Генерируется при переходе в Ready, обнуляется после сканирования.
    /// </summary>
    public string? PickupToken { get; set; }
}
