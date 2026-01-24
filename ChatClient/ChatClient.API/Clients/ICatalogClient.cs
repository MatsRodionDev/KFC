using Contracts.Product;
using Refit;

namespace ChatClient.API.Clients;

public interface ICatalogClient
{
    [Get("/api/products/{productId}")]
    Task<ProductResponse> GetCartItem(Guid productId);
}