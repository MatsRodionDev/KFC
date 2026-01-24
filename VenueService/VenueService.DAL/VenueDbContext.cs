using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.Internal;
using VenueService.DAL.Entities;

namespace VenueService.DAL;

public class VenueDbContext(DbContextOptions<VenueDbContext> options) : DbContext(options)
{
    public DbSet<RestaurantEntity> Restaurants { get; set; }
    public DbSet<RestaurantOrderEntity> RestaurantOrders { get; set; }
    public DbSet<ManagerEntity> Managers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("postgis");

        modelBuilder.Entity<RestaurantEntity>(entity =>
        {
            entity.Property(r => r.Location)
                .HasColumnType("geography (point, 4326)");

            entity.HasIndex(r => r.Location)
                .HasAnnotation(NpgsqlAnnotationNames.IndexMethod, "GIST");
        });

        modelBuilder.Entity<RestaurantOrderEntity>(entity =>
        {
            entity.HasOne(ro => ro.Restaurant)
                .WithMany(r => r.Orders)
                .HasForeignKey(ro => ro.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ManagerEntity>(entity =>
        {
            entity.HasOne(m => m.Restaurant)
                .WithMany(r => r.Managers)
                .HasForeignKey(m => m.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}