using Contracts.Broker.Extensions;
using Contracts.Cache.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Repositories;
using OrderService.Infrastructure.Broker;
using OrderService.Infrastructure.OutboxPattern;
using OrderService.Infrastructure.Persistence;
using OrderService.Infrastructure.Persistence.Repositories;

namespace OrderService.Infrastructure;

public static class ServiceCollectionInfrastructure
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCommonMassTransit(configuration, "order-service");
        
        return services
            .AddDbContext<ApplicationDbContext>(options 
                => options.UseNpgsql(configuration.GetConnectionString(nameof(ApplicationDbContext))))
            .AddCacheServices(configuration)
            .AddHostedService<OutboxProcessingBackgroundService>()
            .AddSingleton<IEventBus, EventBus>()
            .AddScoped<ICartRepository, CartRepository>()
            .AddScoped<ICartItemRepository, CartItemRepository>()
            .AddScoped<IOrderRepository, OrderRepository>()
            .AddScoped<IUnitOfWork, UnitOfWork>();
    }
}