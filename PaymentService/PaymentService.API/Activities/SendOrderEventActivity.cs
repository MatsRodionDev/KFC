using Contracts.Broker.EventBus;
using Contracts.Events;
using Temporalio.Activities;

namespace PaymentService.Activities;

public class SendOrderEventActivity(IEventBus eventBus)
{
    [Activity]
    public async Task SendOrderEventAsync(OrderEvent orderEvent)
    {
        await eventBus.PublishAsync(orderEvent);
    }
}