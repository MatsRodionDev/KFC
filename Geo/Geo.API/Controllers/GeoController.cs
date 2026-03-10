using System.Text.Json;
using Contracts.Geo;
using Geo.API.Clients;
using Geo.API.Extensions;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;

namespace Geo.API.Controllers;

[Controller]
[Route("api/geo")]
public class GeoController(
    IYandexGeocoderApi coordinatesApi,
    IDatabaseAsync redis) : ControllerBase
{
    private const string StoreKey = "geo:store";
    
    [HttpGet("stores/radius")]
    public async Task<IActionResult> GetRadiusStores(
        [FromQuery] double latitude, 
        [FromQuery] double longitude, 
        [FromQuery] int radius = 15)
    {
        var result = await redis.GeoRadiusAsync(StoreKey, longitude, latitude, radius, GeoUnit.Kilometers);
        
        return Ok(result.Select(r => r.ToGeoStoreResponse()).ToArray());
    }
    
    [HttpGet("stores")]
    public async Task<IActionResult> GetStoreByAddress(
        [FromQuery] string address)
    {
        var geohash = await redis.GeoHashAsync(StoreKey, address);

        if (geohash is null)
        {
            return BadRequest("Store with such address doesnt exist");
        }
        
        var result = await redis.StringGetAsync(geohash);
        
        return Ok(JsonSerializer.Deserialize<StoreInfo>(result.ToString()));
    }

    [HttpPost("stores")]
    public async Task<IActionResult> AddStore(
        [FromBody] AddStoreAddressRequest request)
    {
        var geohash = await redis.GeoHashAsync(StoreKey, request.Address);

        if (geohash is not null)
        {
            return BadRequest($"Address already exists, address: {request.Address}");
        }
        
        var response = (await coordinatesApi.GetGeocodeAsync(request.Address))
            .ToAddressGeocodeResponseList()
            .FirstOrDefault();
    
        if (response is null)
        {
            return NotFound("No address found");
        }
        
        var storeInfo = await redis.AddStoreIfNotExistsAsync(request.StoreId, response);
        
        return storeInfo is null 
            ? BadRequest($"Store with such address already exists: {response.Address}")
            : Ok(storeInfo);
    }

    [HttpGet("predictions")]
    public async Task<IActionResult> GetPredictions([FromQuery] AddressPredictionRequest request)
    {
        var geoCode = request.GetGeoCode();
        var response = await coordinatesApi.GetGeocodeAsync(geoCode);
        
       return Ok(response.ToPredictionResponse());
    }
    
    [HttpGet("address")]
    public async Task<IActionResult> GetAddressInfo([FromQuery] string address)
    {
        if (string.IsNullOrEmpty(address) || address.Length < 3)
        {
            return BadRequest("Query must be at least 3 characters long");
        }
        
        var response = (await coordinatesApi.GetGeocodeAsync(address))
            .ToAddressGeocodeResponseList()
            .FirstOrDefault();
        
        return response is null ? NotFound() : Ok(response);
    }
}
