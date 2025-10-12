using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderService.Infrastructure.OutboxPattern;

namespace OrderService.Infrastructure.Persistence.Configurations;

public sealed class OutboxConfiguration : IEntityTypeConfiguration<Outbox>
{
    public void Configure(EntityTypeBuilder<Outbox> builder)
    {
        builder
            .HasKey(x => x.Id);

        builder
            .Property(o => o.Content)
            .HasColumnType("jsonb");
    }
}