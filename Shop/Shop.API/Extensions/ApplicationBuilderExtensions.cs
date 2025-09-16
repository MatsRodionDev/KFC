using Microsoft.EntityFrameworkCore;
using Shop.Infrastructure.Persistence;

namespace Shop.API.Extensions
{
    public static class ApplicationBuilderExtensions
    {
        public static void AddMigrations(this IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            context.Database.Migrate();
        }
    }
}
