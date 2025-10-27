using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Contracts.Cache.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCacheServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddMemoryCache()
            .AddScoped<ICacheService, CacheService>();
        
        return services;
    }
}