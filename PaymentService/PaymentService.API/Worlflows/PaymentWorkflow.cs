using System.Collections.Concurrent;
using Contracts.Events;
using Contracts.Payment;
using PaymentService.Activities;
using PaymentService.Models;
using Temporalio.Workflows;
using static Temporalio.Workflows.Workflow;

namespace PaymentService.Worlflows;

[Workflow]
public class PaymentWorkflow
{
    private readonly DateTime _createdAt = UtcNow;
    private readonly ConcurrentQueue<StripeEventDto> _signalsQueue = new();
    
    private const int TimeoutInMinutes = 10;
    
    private PaymentStatus PaymentStatus;

    [WorkflowRun]
    public async Task RunAsync(PaymentWorkflowInput input)
    {
        Logger.LogInformation(
            "PaymentWorkflow started for OrderId: {OrderId}, SessionId: {SessionId}, Amount: {Amount} {Currency}",
            input.OrderId,
            input.SessionId,
            input.AmountTotal,
            input.Currency);

        await SendInitialPaymentEventAsync(input);

        var expireAt = _createdAt.AddMinutes(TimeoutInMinutes);
        
        while (UtcNow < expireAt)
        {
            await WaitConditionAsync(IsReceivedSignal, expireAt - UtcNow);

            if (!IsReceivedSignal())
                continue;

            await ProcessSignalsAsync(input);
            
            if (PaymentStatus > PaymentStatus.Pending)
                return; 
        }
        
        await HandleCheckoutTimeOutAsync(input.OrderId, input.SessionId, input.CustomerId, UtcNow);
    }

    private async Task SendInitialPaymentEventAsync(PaymentWorkflowInput input)
    {
        var pendingEvent = new PaymentEvent
        {
            Id = NewGuid(),
            OrderId = input.OrderId,
            CheckoutId = input.SessionId,
            CustomerId = input.CustomerId,
            Status = PaymentStatus.Pending,
            OccuredAt = UtcNow
        };

        await ExecuteActivityAsync<SendPaymentEventActivity>(
            a => a.SendPaymentEventAsync(pendingEvent),
            CreateActivityOptions());
        
        PaymentStatus = PaymentStatus.Pending;
    }

    private async Task ProcessSignalsAsync(PaymentWorkflowInput input)
    {
        while (_signalsQueue.TryDequeue(out var eventDto))
        {
            if (eventDto.SessionId != input.SessionId)
            {
                Logger.LogWarning(
                    "Received event for different session. Expected: {ExpectedSessionId}, Got: {ActualSessionId}, EventType: {EventType}",
                    input.SessionId,
                    eventDto.SessionId,
                    eventDto.Type);
                continue;
            }

            Logger.LogInformation(
                "Processing event: {EventType} for SessionId: {SessionId}",
                eventDto.Type,
                eventDto.SessionId);

            switch (eventDto.Type)
            {
                case "checkout.session.completed":
                    await HandleCheckoutSuccessAsync(input.OrderId, eventDto.SessionId, eventDto.CustomerId, eventDto.Created);
                    Logger.LogInformation("Workflow completed successfully for SessionId: {SessionId}", input.SessionId);
                    return;

                case "checkout.session.expired":
                    await HandleCheckoutExpiredAsync(input.OrderId, eventDto.SessionId, eventDto.CustomerId, eventDto.Created);
                    Logger.LogWarning("Workflow completed with session expiration for SessionId: {SessionId}", input.SessionId);
                    return;

                default:
                    Logger.LogInformation("Received unhandled event type: {EventType}", eventDto.Type);
                    break;
            }
        }
    }

    private async Task HandleCheckoutSuccessAsync(Guid orderId, string sessionId, string? customerId, DateTime occuredAt)
    {
        var paymentEvent = new PaymentEvent
        {
            Id = NewGuid(),
            OrderId = orderId,
            CheckoutId = sessionId,
            CustomerId = customerId,
            Status = PaymentStatus.Completed,
            OccuredAt = occuredAt
        };

        var paymentId = await ExecuteActivityAsync<SendPaymentEventActivity, Guid?>(
            a => a.SendPaymentEventAsync(paymentEvent),
            CreateActivityOptions());

        PaymentStatus = PaymentStatus.Completed;
    }

    private async Task HandleCheckoutExpiredAsync(Guid orderId, string sessionId, string? customerId, DateTime occuredAt)
    {
        var expiredPaymentEvent = new PaymentEvent
        {
            Id = NewGuid(),
            OrderId = orderId,
            CheckoutId = sessionId,
            CustomerId = customerId,
            Status = PaymentStatus.Expired,
            OccuredAt = occuredAt
        };

        await ExecuteActivityAsync<SendPaymentEventActivity>(
            a => a.SendPaymentEventAsync(expiredPaymentEvent),
            CreateActivityOptions());

        PaymentStatus = PaymentStatus.Completed;
    }

    private async Task HandleCheckoutTimeOutAsync(Guid orderId, string sessionId, string? customerId, DateTime occuredAt)
    {
        var expiredPaymentEvent = new PaymentEvent
        {
            Id = NewGuid(),
            OrderId = orderId,
            CheckoutId = sessionId,
            CustomerId = customerId,
            Status = PaymentStatus.Expired,
            OccuredAt = occuredAt
        };

        await ExecuteActivityAsync<ExpireCheckoutSessionActivity>(
            a => a.ExpireCheckoutSessionAsync(sessionId),
            CreateActivityOptions());
        
        await ExecuteActivityAsync<SendPaymentEventActivity>(
            a => a.SendPaymentEventAsync(expiredPaymentEvent),
            CreateActivityOptions());

        PaymentStatus = PaymentStatus.Expired;
    }

    private static ActivityOptions CreateActivityOptions() => new()
    {
        StartToCloseTimeout = TimeSpan.FromSeconds(30),
        RetryPolicy = new()
        {
            MaximumAttempts = 3,
            InitialInterval = TimeSpan.FromSeconds(1),
            BackoffCoefficient = 2
        }
    };

    private bool IsReceivedSignal() => !_signalsQueue.IsEmpty;

    [WorkflowSignal]
    public async Task StripeEvent(StripeEventDto eventDto) => _signalsQueue.Enqueue(eventDto);
}