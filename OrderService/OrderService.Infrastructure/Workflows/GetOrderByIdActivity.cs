using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;
using Temporalio.Activities;

namespace OrderService.Infrastructure.Workflows;

public class GetOrderByIdActivity(IUnitOfWork unitOfWork)
{
    [Activity]
    public async Task<Order?> GetByIdAsync(Guid orderId)
    {
        return await unitOfWork.OrderRepository.GetByIdAsync(orderId, CancellationToken.None);
    }
}