using System.Text.Json;
using Contracts.Order;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Courier.Configuration;

public class DeliveryOrderConfiguration : IEntityTypeConfiguration<DeliveryOrder>
{
    private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };
    
    public void Configure(EntityTypeBuilder<DeliveryOrder> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.HasOne(x => x.Courier)
            .WithMany()
            .HasForeignKey(x => x.CourierId);
        
        var comparer = new ValueComparer<Order>(
            (c1, c2) => JsonSerializer.Serialize(c1, JsonOptions) == JsonSerializer.Serialize(c2, JsonOptions),
            c => JsonSerializer.Serialize(c, JsonOptions).GetHashCode(),
            c => c == null ? null! : JsonSerializer.Deserialize<Order>(
                JsonSerializer.Serialize(c, JsonOptions), JsonOptions)!
        );
        
        builder.Property(x => x.Order)
            .HasConversion(
                f => JsonSerializer.Serialize(f, JsonOptions),
                f => JsonSerializer.Deserialize<Order>(f, JsonOptions))
            .Metadata
            .SetValueComparer(comparer);
    }
}
