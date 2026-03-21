using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Enums;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public sealed record ProductListItemDto(
    Guid Id,
    string Name,
    string Description,
    decimal? Price,
    string? ImageName,
    string ProductCategory,
    string? UserId,
    int IngredientsCount);

public sealed record PagedProductsResponse(
    IReadOnlyList<ProductListItemDto> Items,
    int TotalCount);

public sealed record GetProductsPagedQuery(
    int Page,
    int PageSize,
    string? Name,
    string? Description,
    ProductCategory? ProductCategory,
    string? UserId) : IQuery<PagedProductsResponse>;

internal sealed class GetProductsPagedQueryHandler(IUnitOfWork unitOfWork)
    : IQueryHandler<GetProductsPagedQuery, PagedProductsResponse>
{
    public async Task<PagedProductsResponse> Handle(
        GetProductsPagedQuery query,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await unitOfWork.ProductRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            query.Name,
            query.Description,
            query.ProductCategory,
            query.UserId,
            cancellationToken);

        var dtos = items.Select(p => new ProductListItemDto(
            p.Id,
            p.Name,
            p.Description,
            p.Price ?? p.IngredientsPrice,
            p.ImageName,
            p.ProductCategory.ToString(),
            p.UserId,
            p.ProductIngredients.Count)).ToList();

        return new PagedProductsResponse(dtos, totalCount);
    }
}
