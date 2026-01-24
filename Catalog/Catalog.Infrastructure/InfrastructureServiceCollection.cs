using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.Repositories;
using Catalog.Infrastructure.Persistence;
using Catalog.Infrastructure.Persistence.OutboxPattern;
using Catalog.Infrastructure.Persistence.Repositories;
using Catalog.Infrastructure.Persistence.UoW;
using Catalog.Infrastructure.S3Storage;
using Contracts.Broker.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Minio;

namespace Catalog.Infrastructure;

public static class InfrastructureServiceCollection
{
    public static IServiceCollection AddInfrastructureLayer(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString(nameof(ApplicationDbContext))));
        
        return services
            .ConfigureMinio(configuration)
            .AddCommonMassTransit(configuration, "Catalog")
            .AddCommonEventBus()
            .AddHostedService<OutboxProcessingBackgroundService>()
            .AddScoped<IS3Storage, S3Storage.S3Storage>()
            .AddScoped<IProductRepository, ProductRepository>()
            .AddScoped<IIngredientRepository, IngredientRepository>()
            .AddScoped<IProductIngredientRepository, ProductIngredientRepository>()
            .AddScoped<IDrinkRepository, DrinkRepository>()
            .AddScoped<IToppingRepository, ToppingRepository>()
            .AddScoped<IUnitOfWork, UnitOfWork>();
    }
    
    private static IServiceCollection ConfigureMinio(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MinioOptions>(configuration.GetSection(nameof(MinioOptions)));
        services.AddSingleton(sp =>
        {
            var options = sp.GetRequiredService<IOptions<MinioOptions>>();
            
            return new MinioClient()
                .WithEndpoint(options.Value.Endpoint)
                .WithCredentials(options.Value.AccessKey, options.Value.SecretKey)
                .Build();
        });
        
        return services;
    }
}