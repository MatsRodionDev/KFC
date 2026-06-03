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
