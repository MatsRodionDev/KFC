using Catalog.Infrastructure.Persistence;
using Catalog.Infrastructure.S3Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Minio;

namespace Catalog.API.Extensions;

public static class ApplicationBuilderExtensions
{
    public static Task AddBucketAsync(this IApplicationBuilder app)
    {
        var serviceProvider = app.ApplicationServices;
        var client = serviceProvider.GetRequiredService<IMinioClient>();
        var options = serviceProvider.GetRequiredService<IOptions<MinioOptions>>();
        
        return client.CreateBucketIfNotExist(options.Value);
    }
    
    public static async Task MigrateDbAsync(this IApplicationBuilder app)
    {
        await using var scope = app.ApplicationServices.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync();
    }
}