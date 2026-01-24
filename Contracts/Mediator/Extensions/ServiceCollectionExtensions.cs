using Microsoft.Extensions.DependencyInjection;

namespace Contracts.Mediator.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddMediatorDispatcher(this IServiceCollection services)
    {
        services.AddScoped<IDispatcher, Dispatcher>();
        return services;
    }
}