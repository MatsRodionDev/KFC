using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderService.Domain.Models;

namespace OrderService.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };
    
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(i => i.Id);
        
        var comparer = new ValueComparer<List<OrderItemIngredient>>(
            (c1, c2) => JsonSerializer.Serialize(c1, JsonOptions) == JsonSerializer.Serialize(c2, JsonOptions),
            c => JsonSerializer.Serialize(c, JsonOptions).GetHashCode(),
            c => c == null ? null! : JsonSerializer.Deserialize<List<OrderItemIngredient>>(
                JsonSerializer.Serialize(c, JsonOptions), JsonOptions)!
        );

        builder
            .Property(c => c.ItemIngredients)
            .HasConversion(
                f => JsonSerializer.Serialize(f, JsonOptions),
                f => JsonSerializer.Deserialize<List<OrderItemIngredient>>(f, JsonOptions) 
                     ?? new List<OrderItemIngredient>())
            .Metadata
            .SetValueComparer(comparer);
    }
}