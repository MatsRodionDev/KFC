using Contracts.Broker.EventBus;
using Contracts.Courier;
using Contracts.Events;
using Contracts.Order;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Courier.Controllers;

[Controller]
[Route("api/deliveryorder")]
public class DeliveryOrderController(ApplicationDbContext context, IEventBus eventBus) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        return Ok(await context.Orders.ToListAsync());
    }

    [HttpPost("accept")]
    public async Task<IActionResult> AcceptOrder([FromBody] AcceptOrderRequest request)
    {
        var order = await context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId);

        if (order == null)
        {
            return NotFound();
        }

        if (order.CourierId is not null)
        {
            return BadRequest();
        }

        if (!await context.Couriers.AnyAsync(x => x.Id == request.CourierId))
        {
            return BadRequest();
        }
        
        order.CourierId = request.CourierId;
        order.Status = DeliveryStatus.Approved;
        
        await context.SaveChangesAsync();
        await eventBus.PublishAsync(new OrderEvent(Guid.NewGuid(), order.Id, EventType.CourierApproved, DateTime.UtcNow));
        
        return Ok();
    }
    
    [HttpPost("shipped")]
    public async Task<IActionResult> OrderShipped([FromBody] OrderDeliveredRequest request)
    {
        var order = await context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId);

        if (order == null)
        {
            return NotFound();
        }

        if (order.CourierId is not null && order.CourierId != request.CourierId)
        {
            return BadRequest();
        }

        if (order.Status != DeliveryStatus.PickedUp)
        {
            return BadRequest();
        }
        
        order.CourierId = request.CourierId;
        order.Status = DeliveryStatus.Collected;
        
        await context.SaveChangesAsync();
        await eventBus.PublishAsync(new OrderEvent(Guid.NewGuid(), order.Id, EventType.OrderCollected, DateTime.UtcNow));
        
        return Ok();
    }

    [HttpPost("location")]
    public async Task<IActionResult> SendCourierLocation([FromBody] SendCourierLocationRequest request)
    {
        var order = await context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId);

        if (order == null)
        {
            return NotFound();
        }

        if (order.CourierId is not null && order.CourierId != request.CourierId)
        {
            return BadRequest();
        }

        if (order.Status == DeliveryStatus.Collected)
        {
            return BadRequest();
        }
        
        await eventBus.PublishAsync(new CourierLocation
        {
            OrderId = request.OrderId,
            Latitude = request.Coordinates.Latitude,
            Longitude = request.Coordinates.Longitude,
        });
        
        return Ok();
    }
}

public record AcceptOrderRequest(Guid OrderId, string CourierId);

public record OrderDeliveredRequest(Guid OrderId, string CourierId);

public record SendCourierLocationRequest(Guid OrderId, string CourierId, Coordinates Coordinates);
