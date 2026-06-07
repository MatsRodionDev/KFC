using System.Text.Json;
using CourierService.API.Entities;
using CourierService.API.Models;
using CourierService.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourierService.API.Controllers;

[ApiController]
[Route("api/couriers")]
public class CouriersController(CourierDbContext db) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [HttpPost("register")]
    public async Task<ActionResult<CourierAuthResponse>> Register(
        [FromBody] RegisterCourierRequest req,
        CancellationToken ct)
    {
        var phone = NormalizePhone(req.Phone);
        if (string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Телефон и пароль обязательны.");

        if (await db.Couriers.AnyAsync(c => c.Phone == phone, ct))
            return Conflict("Курьер с таким телефоном уже зарегистрирован.");

        var courier = new Courier
        {
            Phone = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName)
                ? $"Курьер {phone[^4..]}"
                : req.DisplayName.Trim(),
        };
        db.Couriers.Add(courier);
        await db.SaveChangesAsync(ct);
        return Ok(new CourierAuthResponse(courier.Id, courier.Phone, courier.DisplayName, courier.IsOnline));
    }

    [HttpPost("login")]
    public async Task<ActionResult<CourierAuthResponse>> Login(
        [FromBody] LoginCourierRequest req,
        CancellationToken ct)
    {
        var phone = NormalizePhone(req.Phone);
        var courier = await db.Couriers.FirstOrDefaultAsync(c => c.Phone == phone, ct);
        if (courier is null || !BCrypt.Net.BCrypt.Verify(req.Password, courier.PasswordHash))
            return Unauthorized("Неверный телефон или пароль.");

        return Ok(new CourierAuthResponse(courier.Id, courier.Phone, courier.DisplayName, courier.IsOnline));
    }

    [HttpGet("{courierId:guid}")]
    public async Task<ActionResult<CourierAuthResponse>> GetProfile(Guid courierId, CancellationToken ct)
    {
        var courier = await db.Couriers.FindAsync([courierId], ct);
        if (courier is null) return NotFound();
        return Ok(new CourierAuthResponse(courier.Id, courier.Phone, courier.DisplayName, courier.IsOnline));
    }

    [HttpPatch("{courierId:guid}/online")]
    public async Task<ActionResult<CourierAuthResponse>> SetOnline(
        Guid courierId,
        [FromBody] UpdateOnlineRequest req,
        CancellationToken ct)
    {
        var courier = await db.Couriers.FindAsync([courierId], ct);
        if (courier is null) return NotFound();
        courier.IsOnline = req.IsOnline;
        await db.SaveChangesAsync(ct);
        return Ok(new CourierAuthResponse(courier.Id, courier.Phone, courier.DisplayName, courier.IsOnline));
    }

    [HttpGet("{courierId:guid}/achievements/shown")]
    public async Task<ActionResult<string[]>> GetShownAchievements(Guid courierId, CancellationToken ct)
    {
        var courier = await db.Couriers.FindAsync([courierId], ct);
        if (courier is null) return NotFound();
        return Ok(DeserializeAchievements(courier.ShownAchievementsJson));
    }

    [HttpPut("{courierId:guid}/achievements/shown")]
    public async Task<IActionResult> SetShownAchievements(
        Guid courierId,
        [FromBody] UpdateShownAchievementsRequest req,
        CancellationToken ct)
    {
        var courier = await db.Couriers.FindAsync([courierId], ct);
        if (courier is null) return NotFound();
        courier.ShownAchievementsJson = JsonSerializer.Serialize(req.AchievementIds ?? [], JsonOpts);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ─── Отзывы ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Оставить отзыв по orderId — курьер определяется автоматически.
    /// </summary>
    [HttpPost("reviews/by-order")]
    public async Task<ActionResult<ReviewDto>> SubmitReviewByOrder(
        [FromBody] SubmitReviewByOrderRequest req,
        CancellationToken ct)
    {
        if (!Guid.TryParse(req.OrderId, out var orderGuid))
            return BadRequest("Некорректный orderId.");

        if (req.Rating < 1 || req.Rating > 5)
            return BadRequest("Оценка должна быть от 1 до 5.");

        // Находим курьера, доставившего этот заказ
        var courierOrder = await db.CourierOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderId == orderGuid && o.Status == "delivered", ct);

        if (courierOrder is null)
            return NotFound("Доставка по указанному заказу не найдена.");

        var courierId = courierOrder.CourierId;

        if (await db.CourierReviews.AnyAsync(r => r.CourierId == courierId && r.OrderId == orderGuid, ct))
            return Conflict("Отзыв для этого заказа уже оставлен.");

        var review = new CourierReview
        {
            CourierId = courierId,
            OrderId = orderGuid,
            Rating = req.Rating,
            Comment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim(),
        };
        db.CourierReviews.Add(review);
        await db.SaveChangesAsync(ct);

        return Ok(new ReviewDto(review.Id, review.OrderId, review.Rating, review.Comment, review.CreatedAt));
    }

    [HttpPost("{courierId:guid}/reviews")]
    public async Task<ActionResult<ReviewDto>> SubmitReview(
        Guid courierId,
        [FromBody] SubmitReviewRequest req,
        CancellationToken ct)
    {
        if (!await db.Couriers.AnyAsync(c => c.Id == courierId, ct))
            return NotFound("Курьер не найден.");

        if (req.Rating < 1 || req.Rating > 5)
            return BadRequest("Оценка должна быть от 1 до 5.");

        if (await db.CourierReviews.AnyAsync(r => r.CourierId == courierId && r.OrderId == req.OrderId, ct))
            return Conflict("Отзыв для этого заказа уже оставлен.");

        var review = new CourierReview
        {
            CourierId = courierId,
            OrderId = req.OrderId,
            Rating = req.Rating,
            Comment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim(),
        };
        db.CourierReviews.Add(review);
        await db.SaveChangesAsync(ct);

        return Ok(new ReviewDto(review.Id, review.OrderId, review.Rating, review.Comment, review.CreatedAt));
    }

    [HttpGet("{courierId:guid}/rating")]
    public async Task<ActionResult<CourierRatingResponse>> GetRating(Guid courierId, CancellationToken ct)
    {
        if (!await db.Couriers.AnyAsync(c => c.Id == courierId, ct))
            return NotFound("Курьер не найден.");

        var reviews = await db.CourierReviews
            .AsNoTracking()
            .Where(r => r.CourierId == courierId)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        if (reviews.Count == 0)
            return Ok(new CourierRatingResponse(null, 0));

        var avg = Math.Round(reviews.Average(), 1);
        return Ok(new CourierRatingResponse(avg, reviews.Count));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static string NormalizePhone(string phone) =>
        new string(phone.Where(char.IsDigit).ToArray());

    private static string[] DeserializeAchievements(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<string[]>(json, JsonOpts) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
