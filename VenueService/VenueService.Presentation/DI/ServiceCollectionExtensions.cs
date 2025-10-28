using VenueService.BLL.DI;
using VenueService.Mappers;

namespace VenueService.DI;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPresentationDependencies(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddBusinessLayerDependencies(configuration);
        services.AddAutoMapper(cfg => cfg.AddProfile<PresentationMappingProfile>());
        
        return services;
    }
}