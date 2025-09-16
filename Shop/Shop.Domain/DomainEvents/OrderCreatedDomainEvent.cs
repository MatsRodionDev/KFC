namespace Shop.Domain.DomainEvents
{
    public record OrderCreatedDomainEvent(Guid Id, Guid OrderId) : DomainEvent(Id);
}
