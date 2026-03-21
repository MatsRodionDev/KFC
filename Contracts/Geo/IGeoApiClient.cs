using Refit;

namespace Contracts.Geo;

/// <summary>
/// Клиент для взаимодействия с Geo.API
/// </summary>
public interface IGeoApiClient
{
    /// <summary>
    /// Получить магазины в радиусе заданных координат
    /// </summary>
    /// <param name="latitude">Широта</param>
    /// <param name="longitude">Долгота</param>
    /// <param name="radius">Радиус поиска (в км, по умолчанию 15)</param>
    [Get("/api/geo/stores/radius")]
    Task<ApiResponse<IEnumerable<GeoStoreResponse>>> GetStoresInRadiusAsync(
        [Query] double latitude,
        [Query] double longitude,
        [Query] int radius = 15);

    /// <summary>
    /// Получить магазин по адресу
    /// </summary>
    /// <param name="address">Адрес магазина</param>
    [Get("/api/geo/stores")]
    Task<ApiResponse<StoreInfo>> GetStoreByAddressAsync([Query] string address);

    /// <summary>
    /// Добавить новый магазин по адресу
    /// </summary>
    /// <param name="request">Данные для добавления</param>
    [Post("/api/geo/stores")]
    Task<ApiResponse<StoreInfo>> AddStoreAsync([Body] AddStoreAddressRequest request);

    /// <summary>
    /// Получить предсказания по адресу (геоподсказки)
    /// </summary>
    [Get("/api/geo/predictions")]
    Task<ApiResponse<AddressPredictionResponse>> GetPredictionsAsync([Query] AddressPredictionRequest request);

    /// <summary>
    /// Получить подробную информацию по адресу
    /// </summary>
    [Get("/api/geo/address")]
    Task<ApiResponse<AddressGeocodeResponse>> GetAddressInfoAsync([Query] string address);
}
