using Microsoft.Extensions.Options;
using PaymentService.Activities;
using PaymentService.Configuration;
using PaymentService.Worlflows;
using Temporalio.Client;
using Temporalio.Worker;

namespace PaymentService.Workers;

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
            var paymentActivity = scope.ServiceProvider.GetRequiredService<SendPaymentEventActivity>();
            var orderActivity = scope.ServiceProvider.GetRequiredService<SendOrderEventActivity>();
            var sessionActivity = scope.ServiceProvider.GetRequiredService<ExpireCheckoutSessionActivity>();

            var workerOptions = new TemporalWorkerOptions(_temporalOptions.TaskQueue)
                .AddWorkflow<PaymentWorkflow>()
                .AddActivity(paymentActivity.SendPaymentEventAsync)
                .AddActivity(orderActivity.SendOrderEventAsync)
                .AddActivity(sessionActivity.ExpireCheckoutSessionAsync);

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

