using Catalog.Application.Common.Interfaces;
using Catalog.Domain.ProductAggregate;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public sealed record GetCustomProductsQuery(string UserId) : IQuery<List<Product>>;

internal sealed class GetCustomProductsQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetCustomProductsQuery, List<Product>>
{
    public async Task<List<Product>> Handle(GetCustomProductsQuery query, CancellationToken cancellationToken)
    {
        var products = await unitOfWork.ProductRepository.GetCustomAsync(query.UserId, cancellationToken);
        return products;
    }
}
