using ChatService.API.Models;
using ChatService.API.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatService.API.Controllers;

/// <summary>REST-эндпоинт для загрузки истории сообщений при открытии чата.</summary>
[ApiController]
[Route("api/messages")]
public class MessagesController(ChatDbContext db) : ControllerBase
{
    /// <summary>
    /// Возвращает историю сообщений заказа (последние 100, от старых к новым).
    /// GET /api/messages/{orderId}
    /// </summary>
    [HttpGet("{orderId}")]
    public async Task<IReadOnlyList<MessageDto>> GetHistory(
        string orderId,
        CancellationToken ct)
    {
        return await db.Messages
            .Where(m => m.OrderId == orderId)
            .OrderBy(m => m.SentAt)
            .Take(100)
            .Select(m => new MessageDto(
                m.Id.ToString(),
                m.OrderId,
                m.SenderName,
                m.Role,
                m.Text,
                m.SentAt))
            .ToListAsync(ct);
    }
}
