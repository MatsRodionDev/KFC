using Contracts.Product;
using Refit;

namespace OrderService.Application.Common.Clients;

public interface ICatalogClient
{
    [Get("/api/products/{productId}")]
    Task<ProductResponse> GetCartItem(Guid productId, CancellationToken cancellationToken);
    
    [Get("/api/menus")]
    Task<MenuResponse> GetMenu(CancellationToken cancellationToken);
    
    [Get("/api/products/custom/{userId}")]
    Task<List<ProductResponse>> GetCustomProducts(Guid userId, CancellationToken cancellationToken);
}

public sealed record MenuResponse(
    List<ProductResponse> Products);