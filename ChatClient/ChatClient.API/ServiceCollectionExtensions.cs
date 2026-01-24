using ChatClient.API.Clients;
using ChatClient.API.Consumer;
using ChatClient.API.Executors;
using ChatClient.API.Factories;
using ChatClient.API.Tools;
using Contracts.Broker.Extensions;
using Contracts.Cache;
using Contracts.Cache.Extensions;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Agents.AI.Workflows;
using Microsoft.EntityFrameworkCore;
using OllamaSharp;
using Refit;

namespace ChatClient.API;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddWeb(this IServiceCollection services, IConfiguration configuration)
    {
        return services
            .AddWorkFlow(configuration)
            .AddClients(configuration)
            .AddCacheServices(configuration)
            .AddDb(configuration)
            .AddCommonMassTransit(configuration, "ChatClient", options =>
            {
                options.AddConsumer<ProductCreatedConsumer>();
            });
    }
    
    private static IServiceCollection AddWorkFlow(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddEmbeddingGenerator(
            new OllamaApiClient("http://localhost:11434", "mxbai-embed-large"));
        
        services.AddScoped<EmbeddingService>();
        services.AddSingleton<ProductTools>();
        
        var factory = new AgentFactory();
        services.AddAIAgent("OrderTextNormalizerAgent", (_, _) => factory.OrderTextNormalizerAgent());
        services.AddAIAgent("OrdeCreaterAgent", (sp, _) => factory.OrdeCreaterAgent(sp));
        services.AddScoped(sp =>
        {
            var scope = sp.CreateScope();
            
            var catalogClient = scope.ServiceProvider.GetRequiredService<ICatalogClient>();
            var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();   
            
            var orderCreatorAgent = sp.GetKeyedService<AIAgent>("OrdeCreaterAgent");
            var orderTextNormalizerAgent = sp.GetKeyedService<AIAgent>("OrderTextNormalizerAgent");
        
            var formatExecutor = new OrderTextNormalizeExecutor(orderTextNormalizerAgent);
            var parseOrderExecutor = new OrderParserExecutor(orderCreatorAgent);
            var incorrectOrderResponseExecutor = new IncorrectOrderResponseExecutor();
            var orderAddProductInfoExecutor = new OrderAddProductInfoExecutor(catalogClient, cacheService);

            var workFlow = new WorkflowBuilder(formatExecutor)
                .AddEdge(formatExecutor, parseOrderExecutor)
                .AddSwitch(formatExecutor, builder => builder
                    .AddCase<OrderTextNormalizeResponse>(result => result.IsOrderRequest, parseOrderExecutor)
                    .AddCase<OrderTextNormalizeResponse>(result => !result.IsOrderRequest, incorrectOrderResponseExecutor))
                .WithOutputFrom(parseOrderExecutor)
                .WithOutputFrom(incorrectOrderResponseExecutor)
                .Build();
    
            return workFlow;
        });
        
        return services;
    }

    private static IServiceCollection AddClients(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddRefitClient<ICatalogClient>()
            .ConfigureHttpClient(c =>
            {
                c.BaseAddress = new Uri("http://localhost:5079");
            });
        
        return services;
    }

    private static IServiceCollection AddDb(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options => 
            options.UseNpgsql(configuration.GetConnectionString(nameof(ApplicationDbContext))));
        
        return services;
    }
}