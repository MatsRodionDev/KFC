using Catalog.Domain.Enums;
using Catalog.Domain.IngredientAggregate;
using Catalog.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    internal sealed class IngredientConfiguration : IEntityTypeConfiguration<Ingredient>
    {
        public void Configure(EntityTypeBuilder<Ingredient> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder.Property(p => p.AvailableForProductCategory);
            builder
                .Property(i => i.Price)
                .HasPrecision(18, 5);

            builder
                .Property(i => i.ForProductCategory)
                .HasConversion<string>();
            
            builder.OwnsOne(p => p.Nutrition, n =>
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
