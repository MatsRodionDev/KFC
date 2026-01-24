namespace PaymentService.Models;

public class CreateCustomerRequest
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
}

