using Microsoft.Extensions.DependencyInjection;
using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;
using Shop.Application.UseCases.AddItemToCart;
using Shop.Application.UseCases.CreateOrder;
using Shop.Application.UseCases.CreateProduct;
using Shop.Application.UseCases.GetCart;
using Shop.Domain.CartAggregate;

namespace Shop.Application.Common.DependencyInjection
{
    public static class ApplicationLayerDependencies
    {
        public static void AddApplicationLayer(this IServiceCollection services)
        {
            services
                .AddScoped<ICommandHandler<AddItemToCartCommand>, AddItemToCartCommandHandler>()
                .AddScoped<IQueryHandler<GetCartQuery, Cart>, GetCartQueryHandler>()
                .AddScoped<ICommandHandler<CreateProductCommand>, CreateProductCommandHandler>()
                .AddScoped<ICommandHandler<CreateOrderCommand>, CreateOrderCommandHandler>()
                .AddScoped<IDispatcher, Dispatcher>();
        }
    }
}
