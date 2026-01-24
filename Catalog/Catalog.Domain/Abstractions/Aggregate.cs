using Contracts.Events;

namespace Catalog.Domain.Abstractions
{
    public abstract class Aggregate : Entity
    {
        private readonly List<IEvent> _domainEvents = [];

        public IReadOnlyCollection<IEvent> DomainEvents => _domainEvents;

        protected void Raise(IEvent domainEvent)
        {
            _domainEvents.Add(domainEvent);
        }
    }
}
