using AutoMapper;
using VenueService.BLL.Models;
using VenueService.DAL.Entities;
using VenueService.DAL.Repositories;

namespace VenueService.BLL.Services;

public interface IRestaurantOrderService : IGenericService<RestaurantOrderModel, RestaurantOrderEntity>;

public class RestaurantOrderService(IGenericRepository<RestaurantOrderEntity> repository, IMapper mapper) 
    : GenericService<RestaurantOrderModel, RestaurantOrderEntity>(repository, mapper), IRestaurantOrderService;