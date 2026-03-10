using OrderService.Domain.Models;

namespace OrderService.Application.Common;

public record OrderSummaryDto(Guid Id, ServiceType ServiceType, OrderStatus Status);
