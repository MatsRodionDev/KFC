using Microsoft.AspNetCore.Mvc;
using PaymentService.Clients;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderServiceClient _orderServiceClient;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IOrderServiceClient orderServiceClient,
        ILogger<OrdersController> logger)
    {
        _orderServiceClient = orderServiceClient;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _orderServiceClient.GetOrderAsync(id, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get order {OrderId}. Status: {StatusCode}", id, response.StatusCode);
                return StatusCode((int)response.StatusCode, new { error = "Failed to retrieve order" });
            }

            return Ok(response.Content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order {OrderId}", id);
            return BadRequest(new { error = ex.Message });
        }
    }
}



