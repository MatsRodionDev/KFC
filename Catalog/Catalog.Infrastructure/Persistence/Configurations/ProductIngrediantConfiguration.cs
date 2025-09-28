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
        }
    }
}
