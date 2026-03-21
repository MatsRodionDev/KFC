using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public sealed record IngredientListItemDto(
    Guid Id,
    string Name,
    decimal Price,
    int Calories,
    int Weight,
    bool IsBase,
    string? ForProductCategory,
    IReadOnlyList<string> AvailableForProductCategories,
    string? ImageName);

public sealed record PagedIngredientsResponse(
    IReadOnlyList<IngredientListItemDto> Items,
    int TotalCount);

public sealed record GetIngredientsPagedQuery(
    int Page,
    int PageSize,
    string? Name,
    bool? IsBase,
    ProductCategory? ForProductCategory) : IQuery<PagedIngredientsResponse>;

internal sealed class GetIngredientsPagedQueryHandler(IUnitOfWork unitOfWork)
    : IQueryHandler<GetIngredientsPagedQuery, PagedIngredientsResponse>
{
    public async Task<PagedIngredientsResponse> Handle(
        GetIngredientsPagedQuery query,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await unitOfWork.IngredientRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            query.Name,
            query.IsBase,
            query.ForProductCategory,
            cancellationToken);

        var dtos = items.Select(i => new IngredientListItemDto(
            i.Id,
            i.Name,
            i.Price,
            i.Nutrition.Calories,
            i.Nutrition.Weight,
            i.IsBase,
            i.ForProductCategory?.ToString(),
            i.AvailableForProductCategory.Select(c => c.ToString()).ToList(),
            i.ImageName)).ToList();

        return new PagedIngredientsResponse(dtos, totalCount);
    }
}
