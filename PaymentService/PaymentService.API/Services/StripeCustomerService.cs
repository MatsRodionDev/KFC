using PaymentService.Models;
using Stripe;

namespace PaymentService.Services;

public class StripeCustomerService : IStripeCustomerService
{
    private readonly CustomerService _customerService;

    public StripeCustomerService(CustomerService customerService)
    {
        _customerService = customerService;
    }

    public async Task<Customer> CreateCustomerAsync(CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var options = new CustomerCreateOptions
        {
            Email = request.Email,
            Name = request.Name,
            Phone = request.Phone,
            Metadata = request.Metadata ?? new Dictionary<string, string>()
        };

        return await _customerService.CreateAsync(options, cancellationToken: cancellationToken);
    }

    public async Task<Customer?> GetCustomerAsync(string customerId, CancellationToken cancellationToken)
    {
        try
        {
            return await _customerService.GetAsync(customerId, cancellationToken: cancellationToken);
        }
        catch (StripeException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Customer> UpdateCustomerAsync(string customerId, string? email = null, string? name = null, string? phone = null, Dictionary<string, string>? metadata = null, CancellationToken cancellationToken = default)
    {
        var options = new CustomerUpdateOptions();

        if (!string.IsNullOrWhiteSpace(email))
        {
            options.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            options.Name = name;
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            options.Phone = phone;
        }

        if (metadata != null)
        {
            options.Metadata = metadata;
        }

        return await _customerService.UpdateAsync(customerId, options, cancellationToken: cancellationToken);
    }

    public async Task<bool> DeleteCustomerAsync(string customerId, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _customerService.DeleteAsync(customerId, cancellationToken: cancellationToken);
            return deleted.Deleted ?? false;
        }
        catch (StripeException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<List<Customer>> ListCustomersAsync(int limit = 10, CancellationToken cancellationToken = default)
    {
        var options = new CustomerListOptions
        {
            Limit = limit
        };

        var customers = await _customerService.ListAsync(options, cancellationToken: cancellationToken);
        return customers.Data.ToList();
    }
}

