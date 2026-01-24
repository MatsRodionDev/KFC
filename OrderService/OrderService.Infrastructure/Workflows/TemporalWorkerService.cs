using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Temporalio.Client;
using Temporalio.Worker;

namespace OrderService.Infrastructure.Workflows;

public class TemporalWorkerService(
    ITemporalClient temporalClient,
    IServiceProvider serviceProvider,
    IOptions<TemporalOptions> temporalOptions,
    ILogger<TemporalWorkerService> logger)
    : BackgroundService
{
    private readonly TemporalOptions _temporalOptions = temporalOptions.Value;
    private TemporalWorker? _worker;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Starting Temporal Worker for TaskQueue: {TaskQueue}, Namespace: {Namespace}",
            _temporalOptions.TaskQueue,
            _temporalOptions.Namespace);

        try
        {
            using var scope = serviceProvider.CreateScope();
            var getOrderActivity = scope.ServiceProvider.GetRequiredService<GetOrderByIdActivity>();
            var processOrderActivity = scope.ServiceProvider.GetRequiredService<ProcessOrderEventActivity>();
            var updatePaymentStatusActivity = scope.ServiceProvider.GetRequiredService<UpdateCardPaymentStatusActivity>();

            var workerOptions = new TemporalWorkerOptions(_temporalOptions.TaskQueue)
                .AddWorkflow<OrderWorkflow>()
                .AddActivity(getOrderActivity.GetByIdAsync)
                .AddActivity(processOrderActivity.ProcessOrderEventAsync)
                .AddActivity(updatePaymentStatusActivity.UpdateCardPaymentStatusAsync);

            _worker = new TemporalWorker(temporalClient, workerOptions);

            logger.LogInformation("Temporal Worker started successfully. Listening for workflows on queue: {TaskQueue}", 
                _temporalOptions.TaskQueue);

            await _worker.ExecuteAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Temporal Worker is stopping due to cancellation");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Temporal Worker encountered an error");
            throw;
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Stopping Temporal Worker");

        if (_worker != null)
        {
            _worker.Dispose();
            logger.LogInformation("Temporal Worker stopped");
        }

        await base.StopAsync(cancellationToken);
    }
    
    public override void Dispose()
    {
        _worker?.Dispose();
        base.Dispose();
    }
}