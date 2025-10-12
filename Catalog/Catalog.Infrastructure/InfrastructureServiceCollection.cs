using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.Repositories;
using Catalog.Infrastructure.Persistence;
using Catalog.Infrastructure.Persistence.Repositories;
using Catalog.Infrastructure.Persistence.UoW;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Catalog.Infrastructure;

public static class InfrastructureServiceCollection
{
    public static IServiceCollection AddInfrastructureLayer(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString(nameof(ApplicationDbContext))));
        
        return services
            .AddScoped<IProductRepository, ProductRepository>()
            .AddScoped<IIngredientRepository, IngredientRepository>()
            .AddScoped<IProductIngredientRepository, ProductIngredientRepository>()
            .AddScoped<IDrinkRepository, DrinkRepository>()
            .AddScoped<IToppingRepository, ToppingRepository>()
            .AddScoped<IUnitOfWork, UnitOfWork>();
    }
}