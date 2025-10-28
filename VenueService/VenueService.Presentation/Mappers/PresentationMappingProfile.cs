using AutoMapper;
using NetTopologySuite.Geometries;
using VenueService.BLL.Models;
using VenueService.Dtos.Requests;
using VenueService.Dtos.Responses;

namespace VenueService.Mappers;

public class PresentationMappingProfile : Profile
{
    public PresentationMappingProfile()
    {
        // Restaurant mappings
        CreateMap<RestaurantModel, RestaurantResponse>()
            .ForMember(dest => dest.Latitude, opt => opt.MapFrom(src => src.Location.Y))
            .ForMember(dest => dest.Longitude, opt => opt.MapFrom(src => src.Location.X));
        
        CreateMap<CreateRestaurantRequest, RestaurantModel>()
            .ForMember(dest => dest.Location, opt => opt.MapFrom(src => 
                new Point(src.Longitude, src.Latitude) { SRID = 4326 }))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Orders, opt => opt.Ignore())
            .ForMember(dest => dest.Managers, opt => opt.Ignore());
        
        CreateMap<UpdateRestaurantRequest, RestaurantModel>()
            .ForMember(dest => dest.Location, opt => opt.MapFrom(src => 
                new Point(src.Longitude, src.Latitude) { SRID = 4326 }))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Orders, opt => opt.Ignore())
            .ForMember(dest => dest.Managers, opt => opt.Ignore());
        
        // Manager mappings
        CreateMap<ManagerModel, ManagerResponse>();
            /*.ForMember(dest => dest.Restaurant, opt => opt.MapFrom(src => src.Restaurant));*/
        
        CreateMap<CreateManagerRequest, ManagerModel>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Restaurant, opt => opt.Ignore());
        
        CreateMap<UpdateManagerRequest, ManagerModel>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Restaurant, opt => opt.Ignore());
        
        // RestaurantOrder mappings
        CreateMap<RestaurantOrderModel, RestaurantOrderResponse>();
            /*.ForMember(dest => dest.Restaurant, opt => opt.MapFrom(src => src.Restaurant));*/
    }
}

