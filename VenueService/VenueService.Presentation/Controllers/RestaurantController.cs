using AutoMapper;
using Contracts.Broker.EventBus;
using Contracts.Events;
using Contracts.Order;
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
    IOrderStorage orderStorage,
    IEventBus eventBus,
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
    
    [HttpGet("{restaurantId:guid}/orders")]
    public async Task<IActionResult> GetAllCookings(Guid restaurantId, CancellationToken cancellationToken = default) 
        => Ok(await orderStorage.GetCookingsAsync(restaurantId));
    
    [HttpGet("{restaurantId:guid}/orders/{orderId:guid}")]
    public async Task<IActionResult> GetCooking(Guid restaurantId, Guid orderId, CancellationToken cancellationToken = default) 
        => Ok(await orderStorage.GetCookingAsync(restaurantId, orderId));

    [HttpPatch("{restaurantId:guid}/orders/{orderId:guid}/ready")]
    public async Task<IActionResult> SetCooking([FromBody] SetCookingReadyRequest request, CancellationToken cancellationToken = default)
    {
        var order = await orderStorage.SetCookingReadyAsync(request.RestaurantId, request.OrderId);
        await eventBus.PublishAsync(new OrderEvent(Guid.NewGuid(), order.Id, EventType.OrderReady, DateTime.UtcNow), cancellationToken);
        
        return Ok(order);
    }
    
    [HttpDelete("{restaurantId:guid}/orders/{orderId:guid}/collected")]
    public async Task<IActionResult> SetCollected([FromBody] SetCookingReadyRequest request, CancellationToken cancellationToken = default)
    {
        var order = await orderStorage.GetCookingAsync(request.RestaurantId, request.OrderId);
        await orderStorage.RemoveCookingAsync(request.RestaurantId, request.OrderId);
        if (order.Delivery.ServiceType is ServiceType.ClickCollect)
        {
            await eventBus.PublishAsync(new OrderEvent(Guid.NewGuid(), order.Id, EventType.OrderCollected, DateTime.UtcNow), cancellationToken);
        }
        else
        {
            await eventBus.PublishAsync(new OrderEvent(Guid.NewGuid(), order.Id, EventType.OrderPickedUp, DateTime.UtcNow), cancellationToken);
        }
        
        return NoContent();
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

public record SetCookingReadyRequest(Guid RestaurantId, Guid OrderId);
