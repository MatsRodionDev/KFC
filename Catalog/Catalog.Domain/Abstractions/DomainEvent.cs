namespace Catalog.Domain.Abstractions
{
    public record DomainEvent(Guid Id) : IDomainEvent;

    public interface IDomainEvent
    {

    }
}
