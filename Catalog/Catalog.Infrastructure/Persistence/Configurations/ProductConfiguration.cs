using Catalog.Domain.ProductAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder
                .Property(p => p.Price)
                .HasPrecision(18, 5);

            builder
                .Property(i => i.ProductCategory)
                .HasConversion<string>();

            builder
                .HasMany(p => p.ProductIngredients)
                .WithOne()
                .HasForeignKey(p => p.ProductId);
        }
    }
}
