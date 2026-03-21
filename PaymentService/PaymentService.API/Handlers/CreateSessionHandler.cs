using System.ComponentModel.DataAnnotations;
using Contracts.Mediator;
using Contracts.Order;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PaymentService.Clients;
using PaymentService.Configuration;
using PaymentService.Extensions;
using PaymentService.Models;
using PaymentService.Services;
using PaymentService.Worlflows;
using Stripe.Checkout;
using Temporalio.Api.Enums.V1;
using Temporalio.Client;

namespace PaymentService.Handlers;

public class CreateSessionCommand : ICommand<Session>
{
    public Guid OrderId { get; set; }

    public string? CustomerId { get; set; }
    
    [Url]
    [Required]
    public string SuccessUrl { get; set; } = string.Empty;
    
    [Url]
    [Required]
    public string CancelUrl { get; set; } = string.Empty;
}

public sealed class CreateSessionHandler(
    IStripeCheckoutService service,
    IStripeCustomerService customerService,
    ITemporalClient temporalClient,
    IOrderServiceClient orderServiceClient,
    IOptions<TemporalOptions> temporalOptions,
    ILogger<CreateSessionHandler> logger) : ICommandHandler<CreateSessionCommand, Session>
{
    public async Task<Session> Handle(CreateSessionCommand command, CancellationToken cancellationToken)
    {
        var order = await GetValidOrderAsync(command.OrderId, cancellationToken);

        if (await IsOrderWorkflowExists(order.Id, cancellationToken))
        {
            throw new Exception("Payment wf for order already exists");
        }
        
        var session = await service.CreateCheckoutSessionAsync(command.ToCreateCustomOrderRequest(order.Items), cancellationToken);
        
        var taskQueue = temporalOptions.Value.TaskQueue;
        await temporalClient.StartWorkflowAsync<PaymentWorkflow>(
            order.Id, 
            taskQueue, 
            c => c.RunAsync(session.ToPaymentWorkflowInput(order.Id)));
        
        logger.LogInformation(
            "Created new workflow for OrderId: {OrderId}, SessionId: {SessionId}",
            command.OrderId,
            session.Id);
        
        return session;
    }

    private async Task<Order> GetValidOrderAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var response = await orderServiceClient.GetOrderAsync(orderId, cancellationToken);

        if (response.Content is null)
        {
            throw new Exception("Order not found");
        }
        
        var order = response.Content;

        if (order.Payment.Status is not null)
        {
            throw new Exception("Payment process was already started");
        }
        
        return order;
    }

    private async Task<bool> IsOrderWorkflowExists(Guid orderId, CancellationToken cancellationToken)
    {
        var workflowId = orderId.WorkflowId<PaymentWorkflow>();
        
        try
        {
            var existingHandle = temporalClient.GetWorkflowHandle<PaymentWorkflow>(workflowId);
            var description = await existingHandle.DescribeAsync();
            
            if (description.Status == WorkflowExecutionStatus.Running)
            {
                logger.LogWarning(
                    "Active workflow already exists for OrderId: {OrderId}, WorkflowId: {WorkflowId}. Cancelling existing workflow.",
                    orderId,
                    workflowId);

                return true;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, 
                "Error checking existing workflow for OrderId: {OrderId}, proceeding with new workflow creation",
                orderId);
            
            return false;
        }
        
        return false;
    }
}