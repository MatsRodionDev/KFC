namespace Contracts.Events;

public record OrderCreatedEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record SendOrderToVduEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record SendOrderToCourierEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record OrderReadyToCourierEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record OrderCourierPickedUpEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record OrderEvent(Guid EventId, Guid OrderId, EventType EventType, DateTime OccuredAt) : IEvent;

public enum EventType
{
    OrderPaid,
    OrderCooking,
    OrderReady,
    CourierApproved ,
    OrderPickedUp,
    OrderCollected,
    OrderPaymentError,
    OrderCookingExpired
}
    
public record ProductCreatedEvent(Guid ProductId, string Name, string Description, decimal Price) : IEvent;
