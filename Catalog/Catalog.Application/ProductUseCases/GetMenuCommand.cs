using Catalog.Application.Common.Interfaces;
using Catalog.Domain.ProductAggregate;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public record MenuResponse(List<Product> Products);

public sealed record GetMenuQuery : IQuery<MenuResponse>;

internal sealed class GetMenuQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetMenuQuery, MenuResponse>
{
    public async Task<MenuResponse> Handle(GetMenuQuery query, CancellationToken cancellationToken)
    {
        var products = await unitOfWork.ProductRepository.GetAllAsync(cancellationToken);
        
        return new MenuResponse(products);
    }
}