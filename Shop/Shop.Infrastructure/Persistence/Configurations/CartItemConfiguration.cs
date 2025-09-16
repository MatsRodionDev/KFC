using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.CartAggregate;
using Shop.Domain.ProductAggregate;

namespace Shop.Infrastructure.Persistence.Configurations
{
    internal sealed class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
    {
        public void Configure(EntityTypeBuilder<CartItem> builder)
        {
            builder
                .HasKey(ci => ci.Id);

            builder
                .Property(ci => ci.Price)
                .HasPrecision(18, 5);
        }
    }
}
