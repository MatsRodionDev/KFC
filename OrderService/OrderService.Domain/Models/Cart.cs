using System.Security.AccessControl;
using System.Text.Json.Serialization;

namespace OrderService.Domain.Models;

public class Cart
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    [JsonIgnore]
    public decimal TotalPrice => Items.Sum(item => item.TotalPrice);

    public List<CartItem> Items { get; set; } = [];
}