using System.Globalization;
using System.Text.Json.Serialization;
using Refit;

namespace Geo.API.Clients
{
    // Интерфейс для Refit-запроса
    public interface IYandexGeocoderApi
    {
        // Пример: https://geocode-maps.yandex.ru/1.x/?apikey=...&geocode=Беларусь+Могилев+ул+Лазаренко&format=json
        [Get("/1.x/")]
        Task<GeocodeResponse> GetGeocodeAsync(
            [AliasAs("geocode")] string query,
            [AliasAs("apikey")] string apiKey = "45e040cd-8625-4021-b31a-795da9728fc2",
            [AliasAs("format")] string format = "json",
            [AliasAs("lang")] string lang = "ru_RU");
    }

    // Главный корневой объект
    public class GeocodeResponse
    {
        [JsonPropertyName("response")]
        public Response Response { get; set; }
    }

    public class Response
    {
        [JsonPropertyName("GeoObjectCollection")]
        public GeoObjectCollection GeoObjectCollection { get; set; }
    }

    public class GeoObjectCollection
    {
        [JsonPropertyName("metaDataProperty")]
        public MetaDataProperty MetaDataProperty { get; set; }

        [JsonPropertyName("featureMember")]
        public List<FeatureMember> FeatureMember { get; set; }
    }

    public class MetaDataProperty
    {
        [JsonPropertyName("GeocoderResponseMetaData")]
        public GeocoderResponseMetaData GeocoderResponseMetaData { get; set; }
    }

    public class GeocoderResponseMetaData
    {
        [JsonPropertyName("request")]
        public string Request { get; set; }

        [JsonPropertyName("results")]
        public string Results { get; set; }

        [JsonPropertyName("found")]
        public string Found { get; set; }
    }

    public class FeatureMember
    {
        [JsonPropertyName("GeoObject")]
        public GeoObject GeoObject { get; set; }
    }

    public class GeoObject
    {
        [JsonPropertyName("metaDataProperty")]
        public GeoObjectMetaDataProperty MetaDataProperty { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("uri")]
        public string Uri { get; set; }

        [JsonPropertyName("Point")]
        public GeoPoint Point { get; set; }
    }

    public class GeoObjectMetaDataProperty
    {
        [JsonPropertyName("GeocoderMetaData")]
        public GeocoderMetaData GeocoderMetaData { get; set; }
    }

    public class GeocoderMetaData
    {
        [JsonPropertyName("precision")]
        public string Precision { get; set; }

        [JsonPropertyName("text")]
        public string Text { get; set; }

        [JsonPropertyName("kind")]
        public string Kind { get; set; }

        [JsonPropertyName("Address")]
        public Address Address { get; set; }
    }

    public class Address
    {
        [JsonPropertyName("country_code")]
        public string CountryCode { get; set; }

        [JsonPropertyName("formatted")]
        public string Formatted { get; set; }

        [JsonPropertyName("Components")]
        public List<AddressComponent> Components { get; set; }
    }

    public class AddressComponent
    {
        [JsonPropertyName("kind")]
        public string Kind { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class GeoPoint
    {
        [JsonPropertyName("pos")]
        public string Position { get; set; }

        public double Longitude => double.Parse(Position.Split(' ')[0], CultureInfo.InvariantCulture);
        public double Latitude => double.Parse(Position.Split(' ')[1], CultureInfo.InvariantCulture);
    }
}