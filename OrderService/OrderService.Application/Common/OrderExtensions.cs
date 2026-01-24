using OrderContract = Contracts.Order.Order;
using Order = OrderService.Domain.Models.Order;
using OrderStatusContract = Contracts.Order.OrderStatus;
using ServiceTypeContract = Contracts.Order.ServiceType;
using OrderItemContract = Contracts.Order.OrderItem;
using OrderItemIngredientContract = Contracts.Order.OrderItemIngredient;
using DeliveryContract = Contracts.Order.Delivery;

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
            Delivery = new DeliveryContract
            {
                ServiceType = Enum.Parse<ServiceTypeContract>(order.Delivery.ServiceType.ToString()),
                Address = order.Delivery.Address,
                StoreAddressInfo = order.Delivery.StoreAddressInfo
            },
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