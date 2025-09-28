using Catalog.Domain.DrinkAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    internal sealed class DrinkConfiguration : IEntityTypeConfiguration<Drink>
    {
        public void Configure(EntityTypeBuilder<Drink> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder
                .Property(i => i.Price)
                .HasPrecision(18, 5);

            builder
                .Property(i => i.Type)
                .HasConversion<string>();
        }
    }
}
