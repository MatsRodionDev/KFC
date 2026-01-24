using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatClient.API.Configurations;

public class ChunkConfiguration : IEntityTypeConfiguration<Chunk>
{
    public void Configure(EntityTypeBuilder<Chunk> builder)
    {
        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.ProductInfo, pi =>
        {
            pi.Property(p => p.Id).HasColumnName("ProductInfoId");
            pi.Property(p => p.Name).HasColumnName("ProductInfoName");
            pi.Property(p => p.Description).HasColumnName("ProductInfoDescription");
        });
    }
}