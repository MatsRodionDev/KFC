using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VenueService.BLL.Models;
using VenueService.BLL.Services;
using VenueService.Dtos.Requests;
using VenueService.Dtos.Responses;

namespace VenueService.Controllers;

// [Authorize]
[ApiController]
[Route("api/restaurants")]
public class RestaurantController(
    IRestaurantService restaurantService,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<List<RestaurantResponse>> GetAll(CancellationToken cancellationToken = default)
    {
        var restaurants = await restaurantService.GetAllAsync(cancellationToken: cancellationToken);
        
        var restaurantResponses = mapper.Map<List<RestaurantResponse>>(restaurants);
        return restaurantResponses;
    }

    [HttpGet("{id:guid}")]
    public async Task<RestaurantResponse> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var restaurant = await restaurantService.GetByIdAsync(id, cancellationToken);
        var restaurantResponse = mapper.Map<RestaurantResponse>(restaurant);
        return restaurantResponse;
    }

    [HttpPost]
    public async Task<RestaurantResponse> Create([FromBody] CreateRestaurantRequest request, 
        CancellationToken cancellationToken = default)
    {
        var model = mapper.Map<RestaurantModel>(request);
        var createdRestaurant = await restaurantService.CreateAsync(model, cancellationToken);
        var response = mapper.Map<RestaurantResponse>(createdRestaurant);
        return response;
    }

    [HttpPut("{id:guid}")]
    public async Task<RestaurantResponse> Update(Guid id, [FromBody] UpdateRestaurantRequest request,
        CancellationToken cancellationToken = default)
    {
        var model = mapper.Map<RestaurantModel>(request);
        var updatedRestaurant = await restaurantService.UpdateAsync(id, model, cancellationToken);
        var response = mapper.Map<RestaurantResponse>(updatedRestaurant);
        return response;
    }

    [HttpDelete("{id:guid}")]
    public async Task Delete(Guid id, CancellationToken cancellationToken = default)
    {
        await restaurantService.DeleteAsync(id, cancellationToken);
    }
}
