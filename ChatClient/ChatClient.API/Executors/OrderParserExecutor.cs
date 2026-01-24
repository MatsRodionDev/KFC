using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using ChatClient.API.Clients;
using ChatClient.API.Dtos;
using Contracts.Cache;
using Contracts.Product;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Workflows;
using Microsoft.Agents.AI.Workflows.Reflection;

namespace ChatClient.API.Executors;

public class OrderParserExecutor(AIAgent agent)
    : ReflectingExecutor<OrderParserExecutor>("OrderParserExecutor"),
        IMessageHandler<OrderTextNormalizeResponse, OrderResponse>
{
    public async ValueTask<OrderResponse> HandleAsync(OrderTextNormalizeResponse message, IWorkflowContext context,
        CancellationToken cancellationToken = new CancellationToken())
    {
        var response = await agent.RunAsync(message.Message, cancellationToken: cancellationToken);
        var orderResponse = response.Deserialize<OrderResponse>(new JsonSerializerOptions()
        {
            PropertyNameCaseInsensitive = true,
            TypeInfoResolver = new DefaultJsonTypeInfoResolver(),
            Converters = { new JsonStringEnumConverter() }
        })!;

        if (!string.IsNullOrEmpty(orderResponse?.Comment))
        {
            orderResponse.Comment = $"Пожалуйста, уточните запрос. {orderResponse.Comment}";
        }
        
        orderResponse ??= new OrderResponse();
        
        return orderResponse;
    }
}

public class OrderAddProductInfoExecutor(ICatalogClient client, ICacheService cache)
    : ReflectingExecutor<OrderParserExecutor>("OrderAddProductInfoExecutor"),
        IMessageHandler<OrderResponse, OrderWfResponse>
{
    public async ValueTask<OrderWfResponse> HandleAsync(OrderResponse message, IWorkflowContext context,
        CancellationToken cancellationToken = new CancellationToken())
    {
        var tasks = message.Products.Select(async productDto =>
        {
            var productId = productDto.ProductId;

            var product = await cache.GetOrAddAsync(productId.ToString(), GetProduct, cancellationToken);

            return new OrderResponseDto(productId, productDto.Name, productDto.Quantity, productDto.CustomIngredients,
                product);

            async Task<ProductResponse?> GetProduct() => await client.GetCartItem(productId);
        });
        
        var products = await Task.WhenAll(tasks);
        
        return new OrderWfResponse
        {
            Products = products.ToList(),
            Comment = message.Comment,
        };
    }
}