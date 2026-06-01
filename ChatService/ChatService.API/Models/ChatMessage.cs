namespace ChatService.API.Models;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>ID заказа — комната чата.</summary>
    public string OrderId { get; set; } = string.Empty;

    /// <summary>Отображаемое имя отправителя.</summary>
    public string SenderName { get; set; } = string.Empty;

    /// <summary>"customer" или "courier".</summary>
    public string Role { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}

/// <summary>DTO, которое отправляется клиентам через SignalR и REST.</summary>
public record MessageDto(
    string Id,
    string OrderId,
    string SenderName,
    string Role,
    string Text,
    DateTime SentAt);
