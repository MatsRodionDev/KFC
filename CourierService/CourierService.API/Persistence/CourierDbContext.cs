using CourierService.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace CourierService.API.Persistence;

public class CourierDbContext(DbContextOptions<CourierDbContext> options) : DbContext(options)
{
    public DbSet<Courier> Couriers => Set<Courier>();
    public DbSet<CourierOrder> CourierOrders => Set<CourierOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Courier>(e =>
        {
            e.HasIndex(c => c.Phone).IsUnique();
            e.Property(c => c.Phone).HasMaxLength(32);
            e.Property(c => c.DisplayName).HasMaxLength(120);
        });

        modelBuilder.Entity<CourierOrder>(e =>
        {
            e.HasIndex(o => new { o.CourierId, o.OrderId }).IsUnique();
            e.HasIndex(o => new { o.CourierId, o.Status });
            e.Property(o => o.Status).HasMaxLength(32);
            e.HasOne(o => o.Courier)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CourierId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
