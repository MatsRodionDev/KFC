using System.Linq.Expressions;
using Temporalio.Client;

namespace OrderService.Infrastructure.Workflows;

public static class TemporalExtensions
{
    public static string WorkflowId<TWorkflow>(this Guid id) => $"{typeof(TWorkflow).Name}:{id}";

    public static async Task<WorkflowSignalResult> SignalAsync<TWorkflow>(this ITemporalClient client, Guid id,
        Expression<Func<TWorkflow, Task>> signalCall)
    {
        var handle = client.GetWorkflowHandle(id.WorkflowId<TWorkflow>());
        await handle.SignalAsync(signalCall);
        return new WorkflowSignalResult(handle.Id);
    }

    public static async Task StartWorkflowAsync<TWorkflow>(this ITemporalClient temporalClient, 
        Guid id,
        string taskQueue,
        Expression<Func<TWorkflow, Task>> workflowRunCall)
    {
        await temporalClient.StartWorkflowAsync<TWorkflow>(
            workflowRunCall, new WorkflowOptions
            {
                Id = id.WorkflowId<TWorkflow>(),
                TaskQueue = taskQueue
            });
    }
    
    public record struct WorkflowSignalResult(string Id);
}