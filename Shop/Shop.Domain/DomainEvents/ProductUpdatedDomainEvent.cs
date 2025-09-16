namespace Shop.Domain.DomainEvents
{
    public record ProductUpdatedDomainEvent(Guid Id, Guid ProductId) : DomainEvent(Id);
}
