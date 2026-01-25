using Contracts.Auth.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Contracts.Auth.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAuth0Authentication(this IServiceCollection services, IConfiguration configuration)
    {
        var authConfiguration = configuration
            .GetSection(AuthConfiguration.SectionName)
            .Get<AuthConfiguration>() ?? throw new InvalidOperationException("Auth configuration is missing");
        
        services.Configure<AuthConfiguration>(configuration.GetSection(AuthConfiguration.SectionName).Bind);
        
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.Authority = authConfiguration.Authority;
            options.Audience = authConfiguration.Audience;
        });
        
        return services;
    }
}
