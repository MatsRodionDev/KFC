using Catalog.Domain.ToppingAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    internal sealed class ToppingConfiguration : IEntityTypeConfiguration<Topping>
    {
        public void Configure(EntityTypeBuilder<Topping> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder
                .Property(i => i.Price)
                .HasPrecision(18, 5);

            builder
                .Property(i => i.AvailableForTypes)
                .HasColumnType("text[]");
        }
    }
}
