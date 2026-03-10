using System.Security.AccessControl;
using System.Text.Json.Serialization;

namespace OrderService.Domain.Models;

public class Cart
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    [JsonIgnore]
    public decimal TotalPrice => Items.Sum(item => item.TotalPrice);
    public Delivery Delivery { get; set; } = new();

    public List<CartItem> Items { get; set; } = [];
}