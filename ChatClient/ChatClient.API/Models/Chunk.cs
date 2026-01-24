using System.ComponentModel.DataAnnotations.Schema;
using Pgvector;

public class Chunk
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public ProductShortInfo ProductInfo { get; set; }
    [Column(TypeName = "vector(1024)")]
    public Vector? Embedding1024 { get; set; }
}