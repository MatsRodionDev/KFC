using AutoMapper;
using Contracts.Geo;
using NetTopologySuite.Geometries;
using VenueService.BLL.Models;
using VenueService.DAL.Entities;
using VenueService.DAL.Repositories;

namespace VenueService.BLL.Services;

public interface IRestaurantService : IGenericService<RestaurantModel, RestaurantEntity>;

public class RestaurantService(IGenericRepository<RestaurantEntity> repository, IGeoApiClient client, IMapper mapper)
    : GenericService<RestaurantModel, RestaurantEntity>(repository, mapper), IRestaurantService
{
    public override async Task<RestaurantModel> CreateAsync(RestaurantModel restaurant, CancellationToken cancellationToken)
    {
        var storeInfo = await client.AddStoreAsync(new AddStoreAddressRequest(restaurant.Id, restaurant.Address));
        var addressInfo = storeInfo.Content?.Address;
        
        if (addressInfo is null)
        {
            throw new Exception("Address does not exist");
        }
        
        var coordinates = addressInfo.Coordinates;
        
        restaurant.Address = addressInfo.Address;
        restaurant.Location = new Point(coordinates.Longitude, coordinates.Latitude);
        
        return await base.CreateAsync(restaurant, cancellationToken);
    }
}