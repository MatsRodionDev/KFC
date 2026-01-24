using Contracts.Broker.Extensions;
using Contracts.Geo;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Refit;
using VenueService.BLL.Consumers;
using VenueService.BLL.Mapper;
using VenueService.BLL.Services;
using VenueService.DAL.DI;

namespace VenueService.BLL.DI;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBusinessLayerDependencies(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddRefitClient<IGeoApiClient>()
            .ConfigureHttpClient(c =>
            {
                c.BaseAddress = new Uri("http://localhost:5172");
            });
        
        services
            .AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("Redis");
            })
            .AddScoped<IOrderStorage, OrderStorage>()
            .AddScoped<INotifyOrderService, NotifyOrderService>()
            .AddDataLayerDependencies(configuration)
            .AddMapping()
            .AddServices()
            .AddMassTransit(configuration);
        
        services.AddSignalR();

        return services;
    }
    
    private static IServiceCollection AddMapping(this IServiceCollection services)
    {
        return services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
    }
    
    private static IServiceCollection AddServices(this IServiceCollection services)
    {
        services
            .AddScoped<IManagerService, ManagerService>()
            .AddScoped<IRestaurantService, RestaurantService>()
            .AddScoped<IRestaurantOrderService, RestaurantOrderService>();

        return services;
    }

    private static IServiceCollection AddMassTransit(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddCommonEventBus()
            .AddCommonMassTransit(configuration, "venue-service", cfg =>
            {
                cfg.AddConsumer<OrderCreatedConsumer>();
            });

        return services;
    }
}