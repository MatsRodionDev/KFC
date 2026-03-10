using OrderService.Application.Common.Interfaces;
using Temporalio.Client;

namespace OrderService.Infrastructure.Workflows;

public class TemporalService(ITemporalClient client) : ITemporalService
{
    public async Task StartOrderWorkFlowAsync(Guid orderId, string userId)
    {
        await client.StartWorkflowAsync<OrderWorkflow>(
            orderId, 
            "order-workflow-broker", 
            w => w.RunAsync(orderId, userId));
    }
}