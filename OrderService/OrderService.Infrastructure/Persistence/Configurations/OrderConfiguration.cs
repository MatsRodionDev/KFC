using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderService.Domain.Models;

namespace OrderService.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };
    
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Payment)
            .WithOne()
            .HasForeignKey<Payment>(p => p.OrderId);
        
        var comparer = new ValueComparer<Delivery>(
            (c1, c2) => JsonSerializer.Serialize(c1, JsonOptions) == JsonSerializer.Serialize(c2, JsonOptions),
            c => JsonSerializer.Serialize(c, JsonOptions).GetHashCode(),
            c => c == null ? null! : JsonSerializer.Deserialize<Delivery>(
                JsonSerializer.Serialize(c, JsonOptions), JsonOptions)!
        );

        builder.Property(x => x.Delivery)
            .HasConversion(
                f => JsonSerializer.Serialize(f, JsonOptions),
                f => JsonSerializer.Deserialize<Delivery>(f, JsonOptions))
            .Metadata
            .SetValueComparer(comparer);
        
        builder.Property(x => x.Delivery).HasColumnType("jsonb");
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasMany(p => p.PaymentEvents)
            .WithOne()
            .HasForeignKey(x => x.PaymentId);
    }
}