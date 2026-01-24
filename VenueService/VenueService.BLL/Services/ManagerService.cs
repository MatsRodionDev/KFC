using AutoMapper;
using VenueService.BLL.Models;
using VenueService.DAL.Entities;
using VenueService.DAL.Repositories;

namespace VenueService.BLL.Services;

public interface IManagerService : IGenericService<ManagerModel, ManagerEntity>;

public class ManagerService(IGenericRepository<ManagerEntity> repository, IMapper mapper) 
    : GenericService<ManagerModel, ManagerEntity>(repository, mapper), IManagerService;