namespace OrderService.Application.Common.Interfaces;

public interface ITemporalService
{
    Task StartOrderWorkFlowAsync(Guid orderId, string userId);
}