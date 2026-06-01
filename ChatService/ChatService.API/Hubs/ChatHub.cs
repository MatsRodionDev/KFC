using ChatService.API.Models;
using ChatService.API.Persistence;
using Microsoft.AspNetCore.SignalR;

namespace ChatService.API.Hubs;

/// <summary>
/// SignalR-хаб для переписки курьера и клиента.
///
/// Клиентский протокол:
///   Invoke  JoinRoom(orderId)                         — войти в комнату заказа
///   Invoke  SendMessage(orderId, text, senderName, role) — отправить сообщение
///   Invoke  LeaveRoom(orderId)                        — покинуть комнату
///
///   On("ReceiveMessage", MessageDto)                  — входящее сообщение
///   On("UserJoined",     string senderName)           — кто-то вошёл
///   On("UserLeft",       string senderName)           — кто-то вышел
/// </summary>
public class ChatHub(ChatDbContext db) : Hub
{
    // ── Вход / выход ────────────────────────────────────────────────────────

    public async Task JoinRoom(string orderId, string senderName)
    {
        var group = RoomGroup(orderId);
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
        await Clients.OthersInGroup(group).SendAsync("UserJoined", senderName);
    }

    public async Task LeaveRoom(string orderId, string senderName)
    {
        var group = RoomGroup(orderId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        await Clients.OthersInGroup(group).SendAsync("UserLeft", senderName);
    }

    // ── Отправка сообщения ───────────────────────────────────────────────────

    public async Task SendMessage(
        string orderId,
        string text,
        string senderName,
        string role)
    {
        if (string.IsNullOrWhiteSpace(text)) return;

        var entity = new ChatMessage
        {
            OrderId    = orderId,
            SenderName = senderName,
            Role       = role,
            Text       = text.Trim(),
            SentAt     = DateTime.UtcNow,
        };

        db.Messages.Add(entity);
        await db.SaveChangesAsync();

        var dto = ToDto(entity);
        await Clients.Group(RoomGroup(orderId)).SendAsync("ReceiveMessage", dto);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static string RoomGroup(string orderId) => $"order-{orderId}";

    private static MessageDto ToDto(ChatMessage m) =>
        new(m.Id.ToString(), m.OrderId, m.SenderName, m.Role, m.Text, m.SentAt);
}
