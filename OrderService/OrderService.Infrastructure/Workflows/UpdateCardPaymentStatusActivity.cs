using Contracts.Mediator;
using OrderService.Application.UseCases;
using OrderService.Domain.Models;
using Temporalio.Activities;
using PaymentEvent = Contracts.Payment.PaymentEvent;

namespace OrderService.Infrastructure.Workflows;

public class UpdateCardPaymentStatusActivity(IDispatcher dispatcher)
{
    [Activity]
    public async Task<Order> UpdateCardPaymentStatusAsync(PaymentEvent paymentEvent)
    {
        return await dispatcher.Dispatch(new UpdateCardPaymentStatusCommand(paymentEvent), CancellationToken.None);
    }
}