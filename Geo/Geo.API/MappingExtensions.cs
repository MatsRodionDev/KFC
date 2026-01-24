using Contracts.Geo;
using Geo.API.Clients;
using StackExchange.Redis;

namespace Geo.API;

public static class MappingExtensions
{
    private static readonly string[] Kinds = ["locality", "street", "house"];

    public static string GetGeoCode(this AddressPredictionRequest request)
    {
        return (!string.IsNullOrWhiteSpace(request.City) ? request.City + " " : "") + request.Query;
    }

    public static GeoStoreResponse ToGeoStoreResponse(this GeoRadiusResult result)
    {
        return new GeoStoreResponse
        {
            Address = result.ToString(),
            Distance = result.Distance,
            Coordinates = new AddressCoordinates
            {
                Latitude = result.Position.Value.Latitude,
                Longitude = result.Position.Value.Longitude,
            }
        };
    }
    
    public static AddressPredictionResponse ToPredictionResponse(this GeocodeResponse response)
    {
        var predictions = response
            .ToAddressGeocodeResponseList()
            .Select(t => new AddressPrediction
            {
                Address = t!.Address,
                Structured = new StructuredFormatting
                {
                    MainText = string.Join(", ", new[]
                    {
                        t.Components.Street ?? t.Components.City,
                        t.Components.HouseNumber
                    }.Where(s => !string.IsNullOrEmpty(s)).Distinct()),
                    SecondaryText = string.Join(", ", new[]
                    {
                        t.Components.Region,
                        t.Components.Country
                    }.Where(s => !string.IsNullOrEmpty(s)).Distinct())
                },
                Uri = t.Uri
            }).ToArray();
        
        return new AddressPredictionResponse
        {
            Predictions = predictions,
            Count = predictions.Length,
        };
    }
    
    public static List<AddressGeocodeResponse> ToAddressGeocodeResponseList(this GeocodeResponse response)
    {
        return response.Response.GeoObjectCollection.FeatureMember
            .Where(m => Kinds.Contains(m.GeoObject?.MetaDataProperty?.GeocoderMetaData?.Kind))
            .Select(ToAddressGeocodeResponse)
            .Where(t => t is not null)
            .ToList();
    }

    private static AddressGeocodeResponse ToAddressGeocodeResponse(FeatureMember member)
    {
        var addressData = member.GeoObject.MetaDataProperty.GeocoderMetaData.Address;
        
        var countries = addressData?.Components?.Where(t => t.Kind == "country").Select(t => t.Name).ToArray() ?? [];
        var provinces = addressData?.Components?.Where(t => t.Kind == "province").Select(t => t.Name).ToArray() ?? [];
        var areas = addressData?.Components?.Where(t => t.Kind == "area").Select(t => t.Name).ToArray() ?? [];
        var districts = addressData?.Components?.Where(t => t.Kind == "district").Select(t => t.Name).ToArray() ?? [];
        var localities = addressData?.Components?.Where(t => t.Kind == "locality").Select(t => t.Name).ToArray() ?? [];
        var streets = addressData?.Components?.Where(t => t.Kind == "street").Select(t => t.Name).ToArray() ?? [];
        var houses = addressData?.Components?.Where(t => t.Kind == "house").Select(t => t.Name).ToArray() ?? [];
        var others = addressData?.Components?.Where(t => t.Kind == "other").Select(t => t.Name).ToArray() ?? [];

        var addressText = member.GeoObject.MetaDataProperty.GeocoderMetaData.Text;
        var point = member.GeoObject.Point;
        
        if (addressData is null || string.IsNullOrEmpty(addressText) || point is null || string.IsNullOrEmpty(point.Position))
        {
            return null;
        }
        
        AddressComponents components = new()
        {
            Country = string.Join(", ", countries),
            CountryCode = addressData.CountryCode,
            Region = provinces.LastOrDefault(),
            City = string.Join(", ", areas.Concat(localities).Concat(districts).Distinct().Where(addressText!.Contains)),
            Street = string.Join(", ", streets.Concat(others).Distinct()),
            HouseNumber = houses.FirstOrDefault(),
        };
        return new AddressGeocodeResponse
        {
            Address = addressText,
            Components = components,
            Coordinates = new AddressCoordinates
            {
                Latitude = point.Latitude,
                Longitude = point.Longitude,
            },
            Uri = member.GeoObject.Uri
        };
    }
}