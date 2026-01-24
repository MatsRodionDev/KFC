using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Catalog.Domain.IngredientAggregate;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public record GetIngredientsForCategoryQuery(ProductCategory category) : IQuery<List<Ingredient>>;

internal sealed class GetIngredientsForCategoryQueryHandler(IUnitOfWork unitOfWork) 
    : IQueryHandler<GetIngredientsForCategoryQuery, List<Ingredient>>
{
    public async Task<List<Ingredient>> Handle(GetIngredientsForCategoryQuery query, CancellationToken cancellationToken)
    {
        return await unitOfWork.IngredientRepository.GetByCategoryAsync(query.category, cancellationToken);
    }
}