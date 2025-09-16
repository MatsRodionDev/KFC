using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shop.Domain.OrderAggregate;
using Shop.Domain.ProductAggregate;

namespace Shop.Infrastructure.Persistence.Configurations
{
    internal sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
    {
        public void Configure(EntityTypeBuilder<OrderItem> builder)
        {
            builder
                .HasKey(oi => oi.Id);

            builder
                .Property(oi => oi.Price)
                .HasPrecision(18, 5);
        }
    }
}
