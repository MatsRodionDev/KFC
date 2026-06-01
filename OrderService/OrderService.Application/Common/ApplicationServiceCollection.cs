using Contracts.Geo;
using Contracts.Mediator;
using Contracts.Mediator.Extensions;
using Medallion.Threading;
using Medallion.Threading.Redis;
using Microsoft.Extensions.DependencyInjection;
using OrderService.Application.Common.Clients;
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

        services
            .AddRefitClient<ICoordinatesApi>()
            .ConfigureHttpClient(c =>
            {
                c.BaseAddress = new Uri("https://nominatim.openstreetmap.org");
                c.DefaultRequestHeaders.UserAgent.ParseAdd("MyApp/1.0 (rodion.mats11@gmail.com)");
            });

        services
            .AddRefitClient<IGeoApiClient>()
            .ConfigureHttpClient(c =>
            {
                c.BaseAddress = new Uri("http://localhost:5172");
            });

        services
            .AddRefitClient<IRestaurantClient>()
            .ConfigureHttpClient(c =>
            {
                c.BaseAddress = new Uri("http://localhost:5113");
            });

        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var configuration = "localhost:6380";
            return ConnectionMultiplexer.Connect(configuration);
        });

        services.AddSingleton<IDistributedLockProvider>(sp =>
        {
            IConnectionMultiplexer multiplexer = sp.GetRequiredService<IConnectionMultiplexer>();
            return new RedisDistributedSynchronizationProvider(
                multiplexer.GetDatabase(),
                options => options.BusyWaitSleepTime(
                    TimeSpan.FromMilliseconds(10),
                    TimeSpan.FromMilliseconds(200)));
        });

        return services
            .AddScoped<IQueryHandler<GetCurrentOrdersQuery, List<Order>>, GetCurrentOrdersQueryHandler>()
            .AddScoped<ICommandHandler<CartAddProductItemCommand, Guid>, CartAddProductItemCommandHandler>()
            .AddScoped<ICommandHandler<OrderCreateCommand, Order>, OrderCreateCommandHandler>()
            .AddScoped<IQueryHandler<GetCartQuery, Cart>, GetCartQueryHandler>()
            .AddScoped<ICommandHandler<SetDeliveryCommand, Guid>, SetDeliveryCommandHandler>()
            .AddScoped<ICommandHandler<CartUpdateItemCommand, Guid>, CartUpdateItemCommandHandler>()
            .AddScoped<IQueryHandler<GetOrdersQuery, List<Order>>, GetOrdersQueryHandler>()
            .AddScoped<IQueryHandler<GetOrderByIdQuery, Order>, GetOrderByIdQueryHandler>()
            .AddScoped<ICommandHandler<UpdateCardPaymentStatusCommand, Order>, UpdateCardPaymentStatusCommandHandler>()
            .AddScoped<ICommandHandler<OrderEventCommand, bool>, ProcessOrderEventHandler>()
            .AddScoped<ICommandHandler<MarkOrderReadyCommand, MarkOrderReadyResult>, MarkOrderReadyCommandHandler>()
            .AddScoped<ICommandHandler<ConfirmPickupCommand, ConfirmPickupResult>, ConfirmPickupCommandHandler>()
            .AddMediatorDispatcher();
    }
}
