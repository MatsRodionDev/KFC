using Medallion.Threading;
using Medallion.Threading.Redis;
using Microsoft.Extensions.DependencyInjection;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Mediator;
using OrderService.Application.UseCases;
using OrderService.Domain.Models;
using Refit;
using StackExchange.Redis;
using Order = OrderService.Domain.Models.Order;

namespace OrderService.Application.Common;

public static class ApplicationServiceCollection
{
    public static IServiceCollection AddApplicationLayer(this IServiceCollection services)
    {
        services.AddRefitClient<ICatalogClient>()
            .ConfigureHttpClient(c =>
            {
                c.BaseAddress = new Uri("http://localhost:5079");
            });
        
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var configuration = "localhost:6380";
            return ConnectionMultiplexer.Connect(configuration);
        });
        
        services.AddSingleton<IDistributedLockProvider>(sp =>
        {
            IConnectionMultiplexer multiplexer = sp.GetRequiredService<IConnectionMultiplexer>();
            return new RedisDistributedSynchronizationProvider(multiplexer.GetDatabase(), options => options.BusyWaitSleepTime(TimeSpan.FromMilliseconds(10), TimeSpan.FromMilliseconds(200)));
        });
        
        return services
            .AddScoped<ICommandHandler<CartAddProductItemCommand, Guid>, CartAddProductItemCommandHandler>()
            .AddScoped<ICommandHandler<OrderCreateCommand, Order>, OrderCreateCommandHandler>()
            .AddScoped<IQueryHandler<GetCartQuery, Cart>, GetCartQueryHandler>()
            .AddScoped<IDispatcher, Dispatcher>();
    }
}