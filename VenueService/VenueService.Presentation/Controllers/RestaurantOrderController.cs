using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using VenueService.BLL.Services;
using VenueService.Dtos.Responses;

namespace VenueService.Controllers;

[ApiController]
[Route("api/restaurant-orders")]
public class RestaurantOrderController(
    IRestaurantOrderService restaurantOrderService,
    IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<List<RestaurantOrderResponse>> GetAll(CancellationToken cancellationToken = default)
    {
        var orders = await restaurantOrderService.GetAllAsync(cancellationToken: cancellationToken);
        
        var orderResponses = mapper.Map<List<RestaurantOrderResponse>>(orders);
        return orderResponses;
    }

    [HttpGet("{id:guid}")]
    public async Task<RestaurantOrderResponse> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await restaurantOrderService.GetByIdAsync(id, cancellationToken);
        var orderResponse = mapper.Map<RestaurantOrderResponse>(order);
        return orderResponse;
    }
}

