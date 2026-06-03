namespace CourierService.API.Entities;

public class Courier
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Phone { get; set; }
    public required string PasswordHash { get; set; }
    public required string DisplayName { get; set; }
    public bool IsOnline { get; set; }
    /// <summary>JSON-массив id достижений, уже показанных в UI.</summary>
    public string ShownAchievementsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<CourierOrder> Orders { get; set; } = [];
}
