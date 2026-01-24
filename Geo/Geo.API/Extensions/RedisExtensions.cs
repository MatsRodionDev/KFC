using System.Text.Json;
using Contracts.Geo;
using Geo.API.Clients;
using StackExchange.Redis;

namespace Geo.API.Extensions;

public static class RedisExtensions
{
    private const string StoreKey = "geo:store";

    public static string GetStoreKey => StoreKey;
    
    public static async Task<StoreInfo?> AddStoreIfNotExistsAsync(this IDatabaseAsync redis, Guid storeId, AddressGeocodeResponse address)
    {
        var geohash = await redis.GeoHashAsync(StoreKey, address.Address);
        
        if (geohash is not null)
        {
            return null;
        }
        
        await redis.GeoAddAsync(StoreKey, 
            address.Coordinates.Longitude, 
            address.Coordinates.Latitude, 
            address.Address);

        var storeInfo = new StoreInfo
        {
            Address = address,
            StoreId = storeId
        };
        
        geohash = await redis.GeoHashAsync(StoreKey, address.Address);
        await redis.StringSetAsync(geohash, JsonSerializer.Serialize(storeInfo));

        return storeInfo;
    }
}