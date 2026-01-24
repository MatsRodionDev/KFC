using OrderService.Domain.Models;

namespace OrderService.Domain.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid orderId, CancellationToken cancellationToken);
    Task<List<Order>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<List<Order>> GetCurrentOrdersAsync(Guid userId, CancellationToken cancellationToken);
    Task AddAsync(Order order, CancellationToken cancellationToken);
    void Update(Order order);
    void UpdatePayment(Payment payment);
    Task AddPaymentEventAsync(PaymentEvent paymentEvent, CancellationToken cancellationToken);
}