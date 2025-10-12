using OrderService.Domain.Models;
using OrderContract = Contracts.Order.Order;
using Order = OrderService.Domain.Models.Order;
using OrderStatusContract = Contracts.Order.OrderStatus;
using ServiceTypeContract = Contracts.Order.ServiceType;
using OrderItemContract = Contracts.Order.OrderItem;
using OrderItemIngredientContract = Contracts.Order.OrderItemIngredient;

namespace OrderService.Application.Common;

public static class OrderExtensions
{
    public static OrderContract ToContract(this Order order)
    {
        return new OrderContract
        {
            Id = order.Id,
            UserId = order.UserId,
            TotalPrice = order.TotalPrice,
            Status = Enum.Parse<OrderStatusContract>(order.Status.ToString()),
            ServiceType = Enum.Parse<ServiceTypeContract>(order.ServiceType.ToString()),
            Items = order.Items.Select(item => new OrderItemContract
            {
                Id = item.Id,
                Quantity = item.Quantity,
                Price = item.Price,
                ProductId = item.ProductId,
                Name = item.Name,
                OrderId = item.OrderId,
                ItemIngredients = item.ItemIngredients.Select(ingredient => new OrderItemIngredientContract
                {
                    Name = ingredient.Name,
                    Quantity = ingredient.Quantity
                })
                .ToList()
            })
            .ToList()
        };
    }
}