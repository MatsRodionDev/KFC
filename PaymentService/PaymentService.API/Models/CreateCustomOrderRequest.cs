using System.ComponentModel.DataAnnotations;
using Contracts.Order;

namespace PaymentService.Models;

public class CreateCustomOrderRequest
{
    public Guid OrderId { get; set; }
    
    public List<OrderItem> Items { get; set; } = [];

    public string? CustomerId { get; set; }

    public string SuccessUrl { get; set; } = string.Empty;
    
    public string CancelUrl { get; set; } = string.Empty;
}

