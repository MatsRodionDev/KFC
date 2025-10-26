using VenueService.DAL.Entities;

namespace VenueService.DAL.Repositories;

public interface IRestaurantRepository : IGenericRepository<RestaurantEntity>;

public class RestaurantRepository(VenueDbContext venueDbContext)
    : GenericRepository<RestaurantEntity>(venueDbContext), IRestaurantRepository;