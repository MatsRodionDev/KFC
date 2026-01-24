using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VenueService.DAL.Repositories;

namespace VenueService.DAL.DI;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDataLayerDependencies(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddDbContext(configuration)
            .AddRepositories();

        return services;
    }
    
    private static IServiceCollection AddDbContext(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddDbContext<VenueDbContext>(options
            =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString(nameof(VenueDbContext)),
                o => o.UseNetTopologySuite()
            );
        });
    } 

    private static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services
            .AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>))
            .AddScoped<IManagerRepository, ManagerRepository>()
            .AddScoped<IRestaurantRepository, RestaurantRepository>()
            .AddScoped<IRestaurantOrderRepository, RestaurantOrderRepository>();

        return services;
    }
}