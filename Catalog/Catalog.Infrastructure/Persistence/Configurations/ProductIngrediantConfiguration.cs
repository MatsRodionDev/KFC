using Catalog.Domain.ProductAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    internal sealed class ProductIngrediantConfiguration : IEntityTypeConfiguration<ProductIngredient>
    {
        public void Configure(EntityTypeBuilder<ProductIngredient> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder
                .Property(i => i.Price)
                .HasPrecision(18, 5);

            builder.OwnsOne(p => p.Quantity, n =>
            {
                n.Property(n => n.Value)
                    .HasColumnName("Quantity")
                    .IsRequired();
            });
            
            builder.OwnsOne(p => p.MinQuantity, n =>
            {
                n.Property(n => n.Value)
                    .HasColumnName("MinQuantity")
                    .IsRequired();
            });
            
            builder.OwnsOne(p => p.MaxQuantity, n =>
            {
                n.Property(n => n.Value)
                    .HasColumnName("MaxQuantity")
                    .IsRequired();
            });
            
            builder.OwnsOne(p => p.TotalNutrition, n =>
            {
                n.Property(x => x.Calories)
                    .HasColumnName("Calories")
                    .IsRequired();
                
                n.Property(x => x.Weight)
                    .HasColumnName("Weight")
                    .IsRequired();
            });
        }
    }
}
