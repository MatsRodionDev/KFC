using Contracts.Product;
using Refit;

namespace OrderService.Application.Common.Clients;

public interface ICatalogClient
{
    [Get("/api/products/{productId}")]
    Task<ProductResponse> GetCartItem(Guid productId, CancellationToken cancellationToken);
}