using ChatService.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatService.API.Persistence;

public class ChatDbContext(DbContextOptions<ChatDbContext> options) : DbContext(options)
{
    public DbSet<ChatMessage> Messages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatMessage>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.OrderId).HasMaxLength(64).IsRequired();
            e.Property(m => m.SenderName).HasMaxLength(128).IsRequired();
            e.Property(m => m.Role).HasMaxLength(16).IsRequired();
            e.Property(m => m.Text).IsRequired();
            e.HasIndex(m => m.OrderId);
        });
    }
}
