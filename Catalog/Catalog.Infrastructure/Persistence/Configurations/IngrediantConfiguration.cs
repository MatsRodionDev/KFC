using Catalog.Domain.IngredientAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    internal sealed class IngrediantConfiguration : IEntityTypeConfiguration<Ingredient>
    {
        public void Configure(EntityTypeBuilder<Ingredient> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder
                .Property(i => i.Price)
                .HasPrecision(18, 5);

            builder
                .Property(i => i.ForProductCategory)
                .HasConversion<string>();
        }
    }
}
