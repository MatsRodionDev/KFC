namespace Shop.Domain.DomainEvents
{
    public record DomainEvent(Guid Id) : IDomainEvent;

    public interface IDomainEvent
    {

    }
}
