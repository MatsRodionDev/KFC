using Contracts.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Pgvector;

namespace ChatClient.API.Consumer;

public class ProductCreatedConsumer(
    ApplicationDbContext dbContext, 
    EmbeddingService embeddingService) : IConsumer<ProductCreatedEvent>
{
    public async Task Consume(ConsumeContext<ProductCreatedEvent> context)
    {
        var product = context.Message;
        
        var anyChunk = await dbContext
            .Chunks
            .AnyAsync(c => c.ProductInfo.Id == product.ProductId);

        if (anyChunk)
        {
            return;
        }
        
        var productsString = $"""
                              Название: {product.Name}
                              Описание: {product.Description}
                              """;
        var embedding = await embeddingService.GenerateAsync(productsString);

        var chunk = new Chunk
        {
            Id = Guid.NewGuid(),
            ProductId = product.ProductId,
            ProductInfo = new ProductShortInfo
            {
                Id = product.ProductId,
                Name = product.Name,
                Description = product.Description,
            },
            Embedding1024 = new Vector(embedding)
        };
        
        await dbContext.Chunks.AddAsync(chunk);
        await dbContext.SaveChangesAsync();
    }
}