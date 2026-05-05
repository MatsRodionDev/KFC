using Contracts.Order;
using Microsoft.EntityFrameworkCore;

namespace Courier;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<DeliveryOrder> Orders { get; set; }
    public DbSet<Courier> Couriers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

public class DeliveryOrder
{
    public Guid Id { get; set; }
    public string? CourierId { get; set; }
    public DeliveryStatus Status { get; set; }
    public Order Order { get; set; }
    
    public Courier? Courier { get; set; }
}

public class Courier
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string PhoneNumber { get; set; }
}

public enum DeliveryStatus
{
    InProcessing,
    Approved,
    PickedUp,
    Collected
}
