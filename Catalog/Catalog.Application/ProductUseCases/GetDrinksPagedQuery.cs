using Catalog.Application.Common.Interfaces;
using Contracts.Mediator;
using Shop.Domain.Enums;

namespace Catalog.Application.ProductUseCases;

public sealed record DrinkListItemDto(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    string Type,
    string? ImageName,
    int ToppingsCount);

public sealed record PagedDrinksResponse(
    IReadOnlyList<DrinkListItemDto> Items,
    int TotalCount);

public sealed record GetDrinksPagedQuery(
    int Page,
    int PageSize,
    string? Name,
    string? Description,
    DrinkType? Type) : IQuery<PagedDrinksResponse>;

internal sealed class GetDrinksPagedQueryHandler(IUnitOfWork unitOfWork)
    : IQueryHandler<GetDrinksPagedQuery, PagedDrinksResponse>
{
    public async Task<PagedDrinksResponse> Handle(
        GetDrinksPagedQuery query,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await unitOfWork.DrinkRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            query.Name,
            query.Description,
            query.Type,
            cancellationToken);

        var dtos = items.Select(d => new DrinkListItemDto(
            d.Id,
            d.Name,
            d.Description,
            d.Price,
            d.Type.ToString(),
            d.ImageName,
            d.DrinkToppings.Count)).ToList();

        return new PagedDrinksResponse(dtos, totalCount);
    }
}
