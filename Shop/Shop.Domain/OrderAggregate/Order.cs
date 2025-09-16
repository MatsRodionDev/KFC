using Shop.Domain.Abstractions;
using Shop.Domain.DomainEvents;
using Shop.Domain.Enums;
using Shop.Domain.Exceptions;

namespace Shop.Domain.OrderAggregate
{
    public class Order : Aggregate
    {
        private readonly HashSet<OrderItem> _items = [];

        private Order(Guid userId)
        {
            Id = Guid.NewGuid();
            OrderStatus = OrderStatus.Created;
            UserId = userId;
            CreatedAt = DateTime.UtcNow;
        }

        public decimal TotalAmount => _items.Sum(i => i.Price * i.Quantity);
        public OrderStatus OrderStatus { get; private set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; private set; }
        public ICollection<OrderItem> Items => [.. _items];

        public static Order Create(Guid userId)
        {
            var order = new Order(userId);

            order.Raise(new OrderCreatedDomainEvent(Guid.NewGuid(), order.Id));   

            return order;
        }

        public void AddItem(
            string productName,
            decimal price,
            int quantity,
            Guid productId)
        {
            if (quantity <= 0)
            {
                throw new DomainException("Quantity has to be greater than 0");
            }

            var item = Items.FirstOrDefault(i => i.ProductId == productId);

            if (item is not null)
            {
                item.IncreaseQuantity(quantity);

                return;
            }

            item = OrderItem.Create(
                productName,
                price,
                quantity,
                productId,
                Id);

            Items.Add(item);
        }
    }

    public class OrderItem : Entity
    {
        private OrderItem(
            string productName,
            decimal price,
            int quantity,
            Guid productId,
            Guid orderId)
        {
            ProductName = productName;
            Price = price;
            Quantity = quantity;
            ProductId = productId;
            OrderId = orderId;
        }

        public string ProductName { get; private set; } = string.Empty;
        public decimal Price { get; private set; }
        public int Quantity { get; private set; }
        public Guid ProductId { get; private set; }
        public Guid OrderId { get; private set; }

        public static OrderItem Create(
            string productName,
            decimal price,
            int quantity,
            Guid productId,
            Guid orderId)
        {
            return new OrderItem(
                productName,
                price,
                quantity,
                productId,
                orderId);
        }

        public void IncreaseQuantity(int delta)
        {
            Quantity += delta;
        }
    }
}
