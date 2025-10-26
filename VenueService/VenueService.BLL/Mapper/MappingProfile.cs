using AutoMapper;
using VenueService.BLL.Models;
using VenueService.DAL.Entities;

namespace VenueService.BLL.Mapper;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<RestaurantEntity, RestaurantModel>().ReverseMap();
        CreateMap<ManagerEntity, ManagerModel>().ReverseMap();
        CreateMap<RestaurantOrderEntity, RestaurantOrderModel>().ReverseMap();
    }
}