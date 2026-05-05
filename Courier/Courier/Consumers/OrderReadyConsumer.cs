using Contracts.Events;
using Contracts.Order;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Courier.Consumers;

public class SendOrderToCourierConsumer(ApplicationDbContext dbContext) : IConsumer<SendOrderToCourierEvent>
{
    public async Task Consume(ConsumeContext<SendOrderToCourierEvent> context)
    {
        var order = context.Message.Order;

        var isOrderExist = await dbContext.Orders.AnyAsync(o => o.Id == order.Id);
        if (isOrderExist)
        {
            return;
        }

        await dbContext.Orders.AddAsync(new DeliveryOrder
        {
            Id = order.Id,
            Status = DeliveryStatus.Approved,
            Order = order
        });
        await dbContext.SaveChangesAsync();
    }
}

public class OrderReadyConsumer(ApplicationDbContext dbContext) : IConsumer<OrderReadyToCourierEvent>
{
    public async Task Consume(ConsumeContext<OrderReadyToCourierEvent> context)
    {
        var deliveryOrder = await dbContext.Orders.FirstOrDefaultAsync(o => o.Id == context.Message.Order.Id);

        if (deliveryOrder == null)
        {
            return;
        }
        
        var order = deliveryOrder.Order;
        order.Status = OrderStatus.Ready;
        await dbContext.SaveChangesAsync();
    }
}

public class OrderCourierPickedUpEventConsumer(ApplicationDbContext dbContext) : IConsumer<OrderCourierPickedUpEvent>
{
    public async Task Consume(ConsumeContext<OrderCourierPickedUpEvent> context)
    {
        var deliveryOrder = await dbContext.Orders.FirstOrDefaultAsync(o => o.Id == context.Message.Order.Id);

        if (deliveryOrder == null)
        {
            return;
        }

        deliveryOrder.Order = context.Message.Order;
        deliveryOrder.Status = DeliveryStatus.PickedUp;
        await dbContext.SaveChangesAsync();
    }
}
