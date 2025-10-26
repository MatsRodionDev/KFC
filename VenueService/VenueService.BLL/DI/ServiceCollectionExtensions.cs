using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VenueService.DAL.DI;

namespace VenueService.BLL.DI;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBusinessLayerDependencies(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddDataLayerDependencies(configuration);

        return services;
    }
}