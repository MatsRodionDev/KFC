using Catalog.Application.Common.Interfaces;
using Contracts.Mediator;
using Shop.Domain.Enums;

namespace Catalog.Application.ProductUseCases;

public sealed record ToppingListItemDto(
    Guid Id,
    string Name,
    decimal Price,
    string? ImageName,
    IReadOnlyList<string> AvailableForTypes);

public sealed record PagedToppingsResponse(
    IReadOnlyList<ToppingListItemDto> Items,
    int TotalCount);

public sealed record GetToppingsPagedQuery(
    int Page,
    int PageSize,
    string? Name,
    DrinkType? AvailableForDrinkType) : IQuery<PagedToppingsResponse>;

internal sealed class GetToppingsPagedQueryHandler(IUnitOfWork unitOfWork)
    : IQueryHandler<GetToppingsPagedQuery, PagedToppingsResponse>
{
    public async Task<PagedToppingsResponse> Handle(
        GetToppingsPagedQuery query,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await unitOfWork.ToppingRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            query.Name,
            query.AvailableForDrinkType,
            cancellationToken);

        var dtos = items.Select(t => new ToppingListItemDto(
            t.Id,
            t.Name,
            t.Price,
            t.ImageName,
            t.AvailableForTypes.Select(x => x.ToString()).ToList())).ToList();

        return new PagedToppingsResponse(dtos, totalCount);
    }
}
