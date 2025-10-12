namespace Contracts.Events;

public record OrderCreatedEvent(
    Guid EventId,
    Order.Order Order) : IEvent;