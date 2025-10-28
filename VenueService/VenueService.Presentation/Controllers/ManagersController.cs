using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using VenueService.BLL.Models;
using VenueService.BLL.Services;
using VenueService.Dtos.Requests;
using VenueService.Dtos.Responses;

namespace VenueService.Controllers;

[ApiController]
[Route("api/managers")]
public class ManagersController(
    IManagerService managerService,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<List<ManagerResponse>> GetAll(CancellationToken cancellationToken = default)
    {
        var managers = await managerService.GetAllAsync(cancellationToken: cancellationToken);
        
        var managerResponses = mapper.Map<List<ManagerResponse>>(managers);
        return managerResponses;
    }

    [HttpGet("{id:guid}")]
    public async Task<ManagerResponse> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var manager = await managerService.GetByIdAsync(id, cancellationToken);
        var managerResponse = mapper.Map<ManagerResponse>(manager);
        return managerResponse;
    }

    [HttpPost]
    public async Task<ManagerResponse> Create([FromBody] CreateManagerRequest request,
        CancellationToken cancellationToken = default)
    {
        var model = mapper.Map<ManagerModel>(request);
        var createdManager = await managerService.CreateAsync(model, cancellationToken);
        var response = mapper.Map<ManagerResponse>(createdManager);
        return response;
    }

    [HttpPut("{id:guid}")]
    public async Task<ManagerResponse> Update(Guid id, [FromBody] UpdateManagerRequest request,
        CancellationToken cancellationToken = default)
    {
        var model = mapper.Map<ManagerModel>(request);
        var updatedManager = await managerService.UpdateAsync(id, model, cancellationToken);
        var response = mapper.Map<ManagerResponse>(updatedManager);
        return response;
    }

    [HttpDelete("{id:guid}")]
    public async Task Delete(Guid id, CancellationToken cancellationToken = default)
    {
        await managerService.DeleteAsync(id, cancellationToken); 
    }
}

