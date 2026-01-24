using System.Linq.Expressions;
using AutoMapper;
using VenueService.BLL.Models;
using VenueService.DAL.Entities;
using VenueService.DAL.Repositories;

namespace VenueService.BLL.Services;

public interface IGenericService<TModel, TEntity> 
    where TModel : BaseModel 
    where TEntity : BaseEntity
{
    Task<List<TModel>> GetAllAsync(Expression<Func<TEntity, bool>>? predicate = null, 
        bool trackChanges = false, CancellationToken cancellationToken = default);

    Task<TModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TModel> CreateAsync(TModel model, CancellationToken cancellationToken = default);

    Task<TModel> UpdateAsync(Guid id, TModel model, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class GenericService<TModel, TEntity>(IGenericRepository<TEntity> repository, IMapper mapper) 
    : IGenericService<TModel, TEntity> 
    where TModel : BaseModel
    where TEntity : BaseEntity
{  
    public virtual async Task<TModel> CreateAsync(TModel model, CancellationToken cancellationToken = default)
    {
        var entity = mapper.Map<TEntity>(model);
        var createdEntity = await repository.CreateAsync(entity, cancellationToken);
        var createdModel = mapper.Map<TModel>(createdEntity);

        return createdModel;
    }

    public virtual async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await repository.GetByIdAsync(id, cancellationToken: cancellationToken);
        if (entity != null)
            await repository.DeleteAsync(entity, cancellationToken); 
    }

    public virtual async Task<List<TModel>> GetAllAsync(Expression<Func<TEntity, bool>>? predicate, 
        bool trackChanges = false, CancellationToken cancellationToken = default)
    {
        var entities = await repository.GetAllAsync(predicate, trackChanges, cancellationToken);
        var models = mapper.Map<List<TModel>>(entities);

        return models;
    }

    public virtual async Task<TModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await repository.GetByIdAsync(id, cancellationToken: cancellationToken) 
            ?? throw new Exception($"No record has been found by given ID {id}");

        var model = mapper.Map<TModel>(entity);

        return model;
    }

    public virtual async Task<TModel> UpdateAsync(Guid id, TModel model, CancellationToken cancellationToken = default)
    {
        _ = await repository.GetByIdAsync(id, cancellationToken: cancellationToken) 
            ?? throw new Exception($"There is no data have been found with ID {id}");

        model.Id = id; 

        var entity = mapper.Map<TEntity>(model);

        var updatedEntity = await repository.UpdateAsync(entity, cancellationToken);

        var updatedModel = mapper.Map<TModel>(updatedEntity);

        return updatedModel;
    }
}