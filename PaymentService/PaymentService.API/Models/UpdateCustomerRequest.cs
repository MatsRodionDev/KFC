namespace PaymentService.Models;

public class UpdateCustomerRequest
{
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
}

