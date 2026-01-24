using VenueService.DAL.Entities;

namespace VenueService.DAL.Repositories; 

public interface IManagerRepository : IGenericRepository<ManagerEntity>;

public class ManagerRepository(VenueDbContext venueDbContext)
    : GenericRepository<ManagerEntity>(venueDbContext), IManagerRepository;