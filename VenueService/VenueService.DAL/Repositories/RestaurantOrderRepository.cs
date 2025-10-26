using VenueService.DAL.Entities;

namespace VenueService.DAL.Repositories;

public interface IRestaurantOrderRepository : IGenericRepository<RestaurantOrderEntity>;

public class RestaurantOrderRepository(VenueDbContext venueDbContext)
    : GenericRepository<RestaurantOrderEntity>(venueDbContext), IRestaurantOrderRepository;