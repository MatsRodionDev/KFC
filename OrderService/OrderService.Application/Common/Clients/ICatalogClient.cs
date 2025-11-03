using Contracts.Product;
using Refit;

namespace OrderService.Application.Common.Clients;

public interface ICatalogClient
{
    [Get("/api/products/{productId}")]
    Task<ProductResponse> GetCartItem(Guid productId, CancellationToken cancellationToken);
    
    [Get("/api/menus/{userId}")]
    Task<MenuResponse> GetMenu(CancellationToken cancellationToken);
    
    [Get("/api/menus/{productIds}")]
    Task<List<ProductResponse>> GetCustomProducts(Guid userId, CancellationToken cancellationToken);
}

public record MenuResponse(
    List<ProductResponse> Products);