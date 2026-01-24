namespace Contracts.Events;

public record OrderCreatedEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record SendOrderToVduEvent(
    Guid EventId,
    Order.Order Order) : IEvent;

public record OrderEvent(Guid EventId, Guid OrderId, EventType EventType, DateTime OccuredAt) : IEvent;

public enum EventType
{
    OrderPaid,
    OrderCooking,
    OrderReady,
    OrderPickedUp,
    OrderDelivered,
    OrderTaken,
    OrderPaymentError
}
    
public record ProductCreatedEvent(Guid ProductId, string Name, string Description, decimal Price) : IEvent;