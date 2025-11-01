using Contracts.Broker.EventBus;
using Contracts.Broker.Extensions;
using Contracts.Cache.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Repositories;
using OrderService.Infrastructure.OutboxPattern;
using OrderService.Infrastructure.Persistence;
using OrderService.Infrastructure.Persistence.Repositories;

namespace OrderService.Infrastructure;

public static class ServiceCollectionInfrastructure
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCommonMassTransit(configuration, "order-service");
        
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(configuration.GetConnectionString(nameof(ApplicationDbContext)));

// Разрешаем сериализацию POCO → JSON
        dataSourceBuilder.EnableDynamicJson();

// (Необязательно — можно настроить System.Text.Json параметры)
        dataSourceBuilder.ConfigureJsonOptions(
            new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
            });

        var dataSource = dataSourceBuilder.Build();
        
        return services
            .AddDbContext<ApplicationDbContext>(options 
                => options.UseNpgsql(dataSource))
            .AddCacheServices(configuration)
            .AddHostedService<OutboxProcessingBackgroundService>()
            .AddCommonEventBus()
            .AddScoped<ICartRepository, CartRepository>()
            .AddScoped<ICartItemRepository, CartItemRepository>()
            .AddScoped<IOrderRepository, OrderRepository>()
            .AddScoped<IUnitOfWork, UnitOfWork>();
    }
}