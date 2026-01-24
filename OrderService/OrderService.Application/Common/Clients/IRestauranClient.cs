using Contracts.Restaurants;
using Refit;

namespace OrderService.Application.Common.Clients;

public interface IRestaurantClient
{
    [Get("/api/restaurants/{id}")]
    Task<RestaurantResponse> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}