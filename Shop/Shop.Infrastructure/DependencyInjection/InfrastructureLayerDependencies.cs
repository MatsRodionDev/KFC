using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shop.Application.Common.Interfaces.Notifiers;
using Shop.Application.Common.Interfaces.UoW;
using Shop.Domain.Interfaces.Repositories;
using Shop.Domain.Services;
using Shop.Infrastructure.BackgroundServices;
using Shop.Infrastructure.Persistence;
using Shop.Infrastructure.Persistence.Repositories;
using Shop.Infrastructure.Persistence.UoW;
using Shop.Infrastructure.SignalR;

namespace Shop.Infrastructure.DependencyInjection
{
    public static class InfrastructureLayerDependencies
    {
        public static void AddInfrastructureLayer(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(opttions =>
                opttions.UseNpgsql(configuration.GetConnectionString(nameof(ApplicationDbContext))));

            services
                .AddScoped<IProductRepository, ProductRepository>()
                .AddScoped<ICartRepository, CartRepository>()
                .AddScoped<IOrderRepository, OrderRepository>()
                .AddScoped<OrderCreationService>()
                .AddScoped<CartProductAdditionService>()
                .AddScoped<IUnitOfWork, UnitOfWork>();

            services.AddScoped<IWorkerNotifier, SignalRWorkerNotifier>();

            services.AddHostedService<OutboxProcessingBackgroundService>();

            services.AddSignalR();
        }
    }
}
