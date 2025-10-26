using AutoMapper;
using VenueService.BLL.Models;
using VenueService.DAL.Entities;
using VenueService.DAL.Repositories;

namespace VenueService.BLL.Services;

public interface IRestaurantService : IGenericService<RestaurantModel, RestaurantEntity>;

public class RestaurantService(IGenericRepository<RestaurantEntity> repository, IMapper mapper) 
    : GenericService<RestaurantModel, RestaurantEntity>(repository, mapper), IRestaurantService;