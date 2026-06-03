using CourierService.API.Models;
using CourierService.API.Persistence;
using CourierService.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourierService.API.Controllers;

[ApiController]
[Route("api/couriers/{courierId:guid}/orders")]
public class CourierOrdersController(CourierDbContext db) : ControllerBase
{
    private static readonly HashSet<string> HistoryStatuses =
        ["delivered", "cancelled"];

    [HttpGet]
    public async Task<ActionResult<List<CourierOrderDto>>> List(
        Guid courierId,
        [FromQuery] string? scope,
        CancellationToken ct)
    {
        if (!await db.Couriers.AnyAsync(c => c.Id == courierId, ct))
            return NotFound();

        var query = db.CourierOrders.AsNoTracking()
            .Where(o => o.CourierId == courierId);

        if (scope == "history")
            query = query.Where(o => HistoryStatuses.Contains(o.Status));
        else if (scope == "active")
            query = query.Where(o => !HistoryStatuses.Contains(o.Status));

        var list = await query
            .OrderByDescending(o => o.UpdatedAt)
            .ToListAsync(ct);

        return Ok(list.Select(OrderMapping.ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<CourierOrderDto>> Upsert(
        Guid courierId,
        [FromBody] SaveCourierOrderRequest req,
        CancellationToken ct)
    {
        if (!await db.Couriers.AnyAsync(c => c.Id == courierId, ct))
            return NotFound();

        if (!Guid.TryParse(req.OrderId, out var orderGuid))
            return BadRequest("Некорректный orderId.");

        var entity = await db.CourierOrders
            .FirstOrDefaultAsync(o => o.CourierId == courierId && o.OrderId == orderGuid, ct);

        if (entity is null)
        {
            entity = new Entities.CourierOrder { CourierId = courierId };
            db.CourierOrders.Add(entity);
        }

        OrderMapping.ApplySnapshot(entity, req);
        await db.SaveChangesAsync(ct);
        return Ok(OrderMapping.ToDto(entity));
    }

    [HttpPatch("{orderId}")]
    public async Task<ActionResult<CourierOrderDto>> UpdateStatus(
        Guid courierId,
        string orderId,
        [FromBody] UpdateCourierOrderStatusRequest req,
        CancellationToken ct)
    {
        if (!Guid.TryParse(orderId, out var orderGuid))
            return BadRequest("Некорректный orderId.");

        var entity = await db.CourierOrders
            .FirstOrDefaultAsync(o => o.CourierId == courierId && o.OrderId == orderGuid, ct);
        if (entity is null) return NotFound();

        entity.Status = req.Status;
        entity.UpdatedAt = DateTime.UtcNow;
        if (req.Status == "delivered")
            entity.CompletedAt ??= DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(OrderMapping.ToDto(entity));
    }
}
