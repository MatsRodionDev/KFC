using PaymentService.Models;
using Stripe;

namespace PaymentService.Services;

public interface IStripeCustomerService
{
    Task<Customer> CreateCustomerAsync(CreateCustomerRequest request, CancellationToken cancellationToken);
    Task<Customer?> GetCustomerAsync(string customerId, CancellationToken cancellationToken);
    Task<Customer> UpdateCustomerAsync(string customerId, string? email = null, string? name = null, string? phone = null, Dictionary<string, string>? metadata = null, CancellationToken cancellationToken = default);
    Task<bool> DeleteCustomerAsync(string customerId, CancellationToken cancellationToken);
    Task<List<Customer>> ListCustomersAsync(int limit = 10, CancellationToken cancellationToken = default);
}

