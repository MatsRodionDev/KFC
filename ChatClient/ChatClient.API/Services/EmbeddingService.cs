using Microsoft.Extensions.AI;

public class EmbeddingService(IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator)
{
    public async Task<float[]> GenerateAsync(string query, CancellationToken ct = default)
    {
        var generatedEmbeddings = await embeddingGenerator.GenerateAsync([query], cancellationToken: ct);
        var queryEmbedding = generatedEmbeddings.Single().Vector.ToArray();

        return queryEmbedding;
    }
}