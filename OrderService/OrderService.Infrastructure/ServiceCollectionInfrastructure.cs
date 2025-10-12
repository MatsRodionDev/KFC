using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Repositories;
using OrderService.Infrastructure.Broker;
using OrderService.Infrastructure.Cache;
using OrderService.Infrastructure.OutboxPattern;
using OrderService.Infrastructure.Persistence;
using OrderService.Infrastructure.Persistence.Repositories;

namespace OrderService.Infrastructure;

public static class ServiceCollectionInfrastructure
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MessageBrokerSettings>(
            configuration.GetSection(nameof(MessageBrokerSettings)));
        services.AddSingleton(sp =>
            sp.GetRequiredService<IOptions<MessageBrokerSettings>>().Value);
        
        services.AddMassTransit(busConfigurator =>
        {
            busConfigurator.SetEndpointNameFormatter(new KebabCaseEndpointNameFormatter("order-service", false));

            busConfigurator.UsingRabbitMq((context, configurator) =>
            {
                var settings = context.GetRequiredService<MessageBrokerSettings>();

                configurator.Host(settings.Host, h =>
                {
                    h.Username(settings.Username);
                    h.Password(settings.Password);
                });

                configurator.ConfigureEndpoints(context);
            });
        });
        
        return services
            .AddDbContext<ApplicationDbContext>(options 
                => options.UseNpgsql(configuration.GetConnectionString(nameof(ApplicationDbContext))))
            .AddMemoryCache()
            .AddHostedService<OutboxProcessingBackgroundService>()
            .AddSingleton<IEventBus, EventBus>()
            .AddScoped<ICacheService, CacheService>()
            .AddScoped<ICartRepository, CartRepository>()
            .AddScoped<ICartItemRepository, CartItemRepository>()
            .AddScoped<IOrderRepository, OrderRepository>()
            .AddScoped<IUnitOfWork, UnitOfWork>();
    }
}