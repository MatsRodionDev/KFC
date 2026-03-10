using System.Collections.Concurrent;
using Contracts.Events;
using OrderService.Domain.Models;
using Temporalio.Workflows;
using static Temporalio.Workflows.Workflow;
using PaymentEventContract = Contracts.Payment.PaymentEvent;

namespace OrderService.Infrastructure.Workflows;

[Workflow]
public class OrderWorkflow
{
    private readonly ConcurrentQueue<object> _signalsQueue = new();
    
    private const int MinutesBeforePaymentCancel = 30;
    private const int HoursBeforeOrderCancel = 4;
    
    [WorkflowRun]
    public async Task<bool> RunAsync(Guid orderId, string userId)
    {
        var order = await ExecuteActivityAsync<GetOrderByIdActivity, Order?>(
            a => a.GetByIdAsync(orderId),
            CreateActivityOptions());

        if (order is null || order.UserId != userId)
        {
            return false;
        }
        
        // Оплата заказа
        
        var expireOrderPaymentAt = UtcNow.AddMinutes(MinutesBeforePaymentCancel);

        while (!order.Payment.Paid)
        {
            await WaitConditionAsync(IsReceivedSignal, expireOrderPaymentAt - UtcNow);

            if (_signalsQueue.TryDequeue(out var signal))
            {
                switch (signal)
                {
                    case OrderEvent orderEvent:
                        await ExecuteActivityAsync<ProcessOrderEventActivity>(
                            a => a.ProcessOrderEventAsync(orderEvent),
                            CreateActivityOptions());
                        break;
                    
                    case PaymentEventContract paymentEvent:
                        order = await ExecuteActivityAsync<UpdateCardPaymentStatusActivity, Order>(
                            a => a.UpdateCardPaymentStatusAsync(paymentEvent),
                            CreateActivityOptions());

                        switch (order.Payment.Status)
                        {
                            case PaymentStatus.Completed:
                                await ExecuteActivityAsync<ProcessOrderEventActivity>(
                                    a => a.ProcessOrderEventAsync(
                                        new OrderEvent(Guid.NewGuid(), orderId, EventType.OrderPaid, UtcNow)),
                                    CreateActivityOptions());
                                break;
                            
                            case PaymentStatus.Canceled
                                or PaymentStatus.Expired:
                                await ExecuteActivityAsync<ProcessOrderEventActivity>(
                                    a => a.ProcessOrderEventAsync(
                                        new OrderEvent(Guid.NewGuid(), orderId, EventType.OrderPaymentError, UtcNow)),
                                    CreateActivityOptions());
                                return false;
                        }

                        break;
                }
            }
            else if (UtcNow > expireOrderPaymentAt)
            {
                await ExecuteActivityAsync<ProcessOrderEventActivity>(
                    a => a.ProcessOrderEventAsync(
                        new OrderEvent(Guid.NewGuid(), orderId, EventType.OrderPaymentError, UtcNow)),
                    CreateActivityOptions());
                return false;
            }
        }
        
        var orderExpireAt = UtcNow.AddHours(HoursBeforeOrderCancel);

        while (orderExpireAt > UtcNow)
        {
            await WaitConditionAsync(IsReceivedSignal, orderExpireAt - UtcNow);

            if (_signalsQueue.TryDequeue(out var signal))
            {
                switch (signal)
                {
                    case OrderEvent orderEvent:
                        await ExecuteActivityAsync<ProcessOrderEventActivity>(
                            a => a.ProcessOrderEventAsync(orderEvent),
                            CreateActivityOptions());
                        break;
                }
            }
            
            if (UtcNow > orderExpireAt)
            {
                return false;
            }
        }
        
        return true;
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
    public async Task PaymentUpdateEvent(PaymentEventContract eventDto) => _signalsQueue.Enqueue(eventDto);
    
    [WorkflowSignal]
    public async Task OrderEvent(OrderEvent eventDto) => _signalsQueue.Enqueue(eventDto);
}