using Catalog.Application.Common.Interfaces;
using Catalog.Application.Common.Mediator;
using Catalog.Application.ProductUseCases;
using Catalog.Domain.IngredientAggregate;
using Catalog.Domain.ProductAggregate;
using Catalog.Domain.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Catalog.Application.Common;

public static class ApplicationServiceCollection
{
    public static IServiceCollection AddApplicationLayer(this IServiceCollection services)
    {
        return services
            .AddScoped<ICommandHandler<AddProductCommand, Guid>, AddProductCommandHandler>()
            .AddScoped<ICommandHandler<AddCustomProductCommand, Guid>, AddCustomProductCommandHandler>()
            .AddScoped<ICommandHandler<CreateIngredientCommand, Guid>, CreateIngredientCommandHandler>()
            .AddScoped<ICommandHandler<AddDrinkCommand, Guid>, AddDrinkCommandHandler>()
            .AddScoped<ICommandHandler<AddToppingCommand, Guid>, AddToppingCommandHandler>()
            .AddScoped<IQueryHandler<GetProductQuery, Product>, GetProductQueryHandler>()
            .AddScoped<IQueryHandler<GetIngredientQuery, Ingredient>, GetIngredientQueryHandler>()
            .AddScoped<ProductAdditionService>()
            .AddScoped<ToppingToDrinkAdditionService>()
            .AddScoped<IDispatcher, Dispatcher>();
    }
}