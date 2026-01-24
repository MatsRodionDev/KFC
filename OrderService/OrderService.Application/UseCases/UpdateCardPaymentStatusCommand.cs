using Contracts.Events;
using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;
using PaymentEvent = Contracts.Payment.PaymentEvent;
using PaymentStatus = OrderService.Domain.Models.PaymentStatus;

namespace OrderService.Application.UseCases;

public record UpdateCardPaymentStatusCommand(PaymentEvent PaymentEvent) : ICommand<Order>;

public class UpdateCardPaymentStatusCommandHandler(IUnitOfWork unitOfWork) : ICommandHandler<UpdateCardPaymentStatusCommand, Order>
{
    public async Task<Order> Handle(UpdateCardPaymentStatusCommand command, CancellationToken cancellationToken)
    {
        var paymentEvent = command.PaymentEvent;
        
        var order = await unitOfWork.OrderRepository.GetByIdAsync(paymentEvent.OrderId, cancellationToken);

        if (order is null)
        {
            throw new Exception("Order not found");
        }

        if (order.Payment.PaymentEvents is not null
            && order.Payment.PaymentEvents.Any(p => p.Id == paymentEvent.Id))
        {
            return order;
        }

        if (order.Payment.PaymentEvents is null || !order.Payment.PaymentEvents.Any())
        {
            order.Payment.CheckoutId =  paymentEvent.CheckoutId;
            order.Payment.Status = Enum.Parse<PaymentStatus>(paymentEvent.Status.ToString());
            var newEvent = AddEvent(order.Payment, paymentEvent);
            
            unitOfWork.OrderRepository.UpdatePayment(order.Payment);
            await unitOfWork.OrderRepository.AddPaymentEventAsync(newEvent, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
            return order;
        }

        List<IEvent> events = [];
        
        order.Payment.Status = Enum.Parse<PaymentStatus>(paymentEvent.Status.ToString());
        await unitOfWork.OrderRepository.AddPaymentEventAsync(
            AddEvent(order.Payment, paymentEvent), 
            cancellationToken);

        switch (paymentEvent.Status.ToString())
        {
            case nameof(PaymentStatus.Completed):
                order.Payment.Paid = true;
                break;
            
            case nameof(PaymentStatus.Canceled):
            case nameof(PaymentStatus.Expired):
                order.Payment.Paid = false;
                order.Status = OrderStatus.Cancelled;
                break;
        }
        
        unitOfWork.OrderRepository.UpdatePayment(order.Payment);
        unitOfWork.OrderRepository.Update(order);
        await unitOfWork.SaveChangesAsync(events, cancellationToken: cancellationToken);
        return order;
    }

    private static Domain.Models.PaymentEvent AddEvent(Payment payment, PaymentEvent paymentEvent)
    {
        var newPaymentEvent = new Domain.Models.PaymentEvent
        {
            Id = paymentEvent.Id,
            PaymentId = payment.Id,
            Status = Enum.Parse<PaymentStatus>(paymentEvent.Status.ToString()),
            OrderId = paymentEvent.OrderId,
            CheckoutId = paymentEvent.CheckoutId,
            CustomerId = paymentEvent.CustomerId,
            OccuredAt = DateTime.UtcNow
        };
        
        payment.PaymentEvents ??= [];
        payment.PaymentEvents.Add(newPaymentEvent);
        return newPaymentEvent;
    }
}