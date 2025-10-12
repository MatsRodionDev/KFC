using Catalog.Application.Common.Interfaces;
using Catalog.Application.Common.Mediator;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ProductAggregate;

namespace Catalog.Application.ProductUseCases;

public sealed record GetProductQuery(
    Guid ProductId) : IQuery<Product>;

internal sealed class GetProductQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetProductQuery, Product>
{
    public async Task<Product> Handle(GetProductQuery query, CancellationToken cancellationToken)
    {
        return await unitOfWork.ProductRepository.GetByIdAsync(query.ProductId, cancellationToken) 
               ?? throw new Exception("Product not found");
    }
}