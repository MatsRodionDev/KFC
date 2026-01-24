using Microsoft.AspNetCore.Mvc;
using PaymentService.Models;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IStripeCustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(IStripeCustomerService customerService, ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var customer = await _customerService.CreateCustomerAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetCustomer), new { customerId = customer.Id }, customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{customerId}")]
    public async Task<IActionResult> GetCustomer(string customerId, CancellationToken cancellationToken)
    {
        try
        {
            var customer = await _customerService.GetCustomerAsync(customerId, cancellationToken);
            if (customer == null)
            {
                return NotFound(new { error = "Customer not found" });
            }
            return Ok(customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer {CustomerId}", customerId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{customerId}")]
    public async Task<IActionResult> UpdateCustomer(string customerId, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var customer = await _customerService.UpdateCustomerAsync(
                customerId,
                request.Email,
                request.Name,
                request.Phone,
                request.Metadata,
                cancellationToken);
            return Ok(customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer {CustomerId}", customerId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{customerId}")]
    public async Task<IActionResult> DeleteCustomer(string customerId, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _customerService.DeleteCustomerAsync(customerId, cancellationToken);
            if (!deleted)
            {
                return NotFound(new { error = "Customer not found" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer {CustomerId}", customerId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> ListCustomers([FromQuery] int limit = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            var customers = await _customerService.ListCustomersAsync(limit, cancellationToken);
            return Ok(customers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing customers");
            return BadRequest(new { error = ex.Message });
        }
    }
}

