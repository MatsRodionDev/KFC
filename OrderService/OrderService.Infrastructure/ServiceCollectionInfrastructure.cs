using Contracts.Broker.EventBus;
using Contracts.Broker.Extensions;
using Contracts.Cache.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Repositories;
using OrderService.Infrastructure.Broker.Consumers;
using OrderService.Infrastructure.Hubs;
using OrderService.Infrastructure.OutboxPattern;
using OrderService.Infrastructure.Persistence;
using OrderService.Infrastructure.Persistence.Repositories;
using OrderService.Infrastructure.Workflows;
using Temporalio.Client;

namespace OrderService.Infrastructure;

public static class ServiceCollectionInfrastructure
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCommonMassTransit(configuration, "order-service", conf =>
        {
            conf.AddConsumer<OrderEventConsumer>();
        });

        services.Configure<TemporalOptions>(configuration);
        
        services.AddSingleton<ITemporalClient>(serviceProvider =>
        {
            var temporalOptions = configuration.GetSection(TemporalOptions.SectionName).Get<TemporalOptions>();
            var logger = serviceProvider.GetRequiredService<ILogger<ITemporalClient>>();
            var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
    
            logger.LogInformation(
                "Connecting to Temporal server at {Address}, Namespace: {Namespace}",
                temporalOptions.Address,
                temporalOptions.Namespace);

            try
            {
                var client = TemporalClient.ConnectAsync(new(temporalOptions.Address)
                {
                    Namespace = temporalOptions.Namespace,
                    LoggerFactory = loggerFactory
                }).GetAwaiter().GetResult();
        
                logger.LogInformation("Successfully connected to Temporal server");
                return client;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to connect to Temporal server at {Address}", temporalOptions.Address);
                throw new InvalidOperationException(
                    $"Failed to connect to Temporal server at {temporalOptions.Address}. " +
                    "Make sure Temporal server is running.", ex);
            }
        });
        
        services.AddScoped<UpdateCardPaymentStatusActivity>();
        services.AddScoped<GetOrderByIdActivity>();
        services.AddScoped<ProcessOrderEventActivity>();
        
        services.AddHostedService<TemporalWorkerService>();
        
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(configuration.GetConnectionString(nameof(ApplicationDbContext)));
        dataSourceBuilder.EnableDynamicJson();
        dataSourceBuilder.ConfigureJsonOptions(
            new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
            });

        var dataSource = dataSourceBuilder.Build();
        
        services.AddSignalR()
            .AddJsonProtocol(options =>
            {
                options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            });
        
        return services
            .AddDbContext<ApplicationDbContext>(options 
                => options.UseNpgsql(dataSource))
            .AddCacheServices(configuration)
            .AddHostedService<OutboxProcessingBackgroundService>()
            .AddCommonEventBus()
            .AddScoped<IOrderStatusService, OrderStatusService>()
            .AddScoped<ITemporalService, TemporalService>()
            .AddScoped<ICartRepository, CartRepository>()
            .AddScoped<ICartItemRepository, CartItemRepository>()
            .AddScoped<IOrderRepository, OrderRepository>()
            .AddScoped<IUnitOfWork, UnitOfWork>();
    }
}