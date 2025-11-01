using System.Text.Json.Serialization;
using OrderService.Domain.Models;
using Refit;

namespace OrderService.Application.Common.Clients;

public interface ICoordinatesApi
{
    // Пример запроса:
    // https://nominatim.openstreetmap.org/search?q=ул.+Ленина,+Москва&format=json&limit=1
    [Get("/search")]
    Task<List<CoordinatesResponse>> SearchAsync(
        [AliasAs("q")] string query,
        [AliasAs("format")] string format = "json",
        [AliasAs("limit")] int limit = 1,
        CancellationToken cancellationToken = default);
}

public record CoordinatesResponse
{
    [JsonPropertyName("lat")]
    public string Lat { get; set; } = "";

    [JsonPropertyName("lon")]
    public string Lon { get; set; } = "";

    public Coordinates ToDomainModel() =>
        new Coordinates
        {
            Latitude = double.Parse(Lat, System.Globalization.CultureInfo.InvariantCulture),
            Longitude = double.Parse(Lon, System.Globalization.CultureInfo.InvariantCulture)
        };
}