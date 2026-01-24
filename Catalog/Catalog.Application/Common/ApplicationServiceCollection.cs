using Catalog.Application.ProductUseCases;
using Catalog.Domain.IngredientAggregate;
using Catalog.Domain.ProductAggregate;
using Catalog.Domain.Services;
using Contracts.Mediator;
using Contracts.Mediator.Extensions;
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
            .AddScoped<IQueryHandler<GetMenuQuery, MenuResponse>, GetMenuQueryHandler>()
            .AddScoped<IQueryHandler<GetProductQuery, Product>, GetProductQueryHandler>()
            .AddScoped<IQueryHandler<GetIngredientQuery, Ingredient>, GetIngredientQueryHandler>()
            .AddScoped<IQueryHandler<GetCustomProductsQuery, List<Product>>, GetCustomProductsQueryHandler>()
            .AddScoped<IQueryHandler<GetIngredientsForCategoryQuery, List<Ingredient>>, GetIngredientsForCategoryQueryHandler>()
            .AddScoped< ICommandHandler<CreateBaseIngredientCommand, Guid>, CreateBaseIngredientCommandHandler>()
            .AddScoped<ProductAdditionService>()
            .AddScoped<ToppingToDrinkAdditionService>()
            .AddMediatorDispatcher();
    }
}