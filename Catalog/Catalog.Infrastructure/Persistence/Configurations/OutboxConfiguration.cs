using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations
{
    public sealed class OutboxConfiguration : IEntityTypeConfiguration<Outbox.Outbox>
    {
        public void Configure(EntityTypeBuilder<Outbox.Outbox> builder)
        {
            builder
                .HasKey(x => x.Id);

            builder
                .Property(o => o.Content)
                .HasColumnType("jsonb");
        }
    }
}
