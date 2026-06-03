namespace CourierService.API.Models;

public record RegisterCourierRequest(string Phone, string Password, string? DisplayName);
public record LoginCourierRequest(string Phone, string Password);
public record CourierAuthResponse(Guid Id, string Phone, string DisplayName, bool IsOnline);

public record UpdateOnlineRequest(bool IsOnline);
public record UpdateShownAchievementsRequest(string[] AchievementIds);

public record CourierOrderItemDto(string Id, string Name, int Quantity);

public record CourierOrderDto(
    Guid Id,
    string OrderId,
    string ClientName,
    string ClientPhone,
    string AddressA,
    string AddressB,
    decimal Price,
    string Distance,
    string Status,
    double PickupLatitude,
    double PickupLongitude,
    double DestinationLatitude,
    double DestinationLongitude,
    List<CourierOrderItemDto> Items,
    DateTime CreatedAt,
    DateTime? CompletedAt);

public record SaveCourierOrderRequest(
    string OrderId,
    string ClientName,
    string ClientPhone,
    string AddressA,
    string AddressB,
    decimal Price,
    string Distance,
    string Status,
    double PickupLatitude,
    double PickupLongitude,
    double DestinationLatitude,
    double DestinationLongitude,
    List<CourierOrderItemDto> Items);

public record UpdateCourierOrderStatusRequest(string Status);
