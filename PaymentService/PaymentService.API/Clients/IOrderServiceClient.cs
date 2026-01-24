using Contracts.Order;
using Contracts.Payment;
using Refit;
using PaymentEvent = Contracts.Payment.PaymentEvent;

namespace PaymentService.Clients;

public interface IOrderServiceClient
{
    [Post("/api/orders/payment")]
    Task<ApiResponse<Guid>> SendPaymentEventAsync([Body] PaymentEvent paymentEvent, CancellationToken cancellationToken);

    [Get("/api/orders/{id}")]
    Task<ApiResponse<Order>> GetOrderAsync(Guid id, CancellationToken cancellationToken);
}

