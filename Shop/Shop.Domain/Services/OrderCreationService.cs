using Shop.Domain.CartAggregate;
using Shop.Domain.Interfaces.Repositories;
using Shop.Domain.Exceptions;
using Shop.Domain.OrderAggregate;

namespace Shop.Domain.Services
{
    public class OrderCreationService(IProductRepository productRepository)
    {
        public async Task<Order> CreateOrderFromCartAsync(Cart cart, CancellationToken cancellationToken)
        {
            var order = Order.Create(cart.UserId);

            var productsIds = cart.Items.Select(i => i.ProductId).ToList();

            var products = await productRepository.GetByIdsAsync(productsIds, cancellationToken);
            var productsDictionary = products.ToDictionary(p => p.Id);

            foreach (var item in cart.Items)
            {
                if (!productsDictionary.TryGetValue(item.ProductId, out var product))
                {
                    throw new DomainException($"There is no such product: {item.ProductName}");
                }

                product.DecreaseStockQuantity(item.Quantity);

                order.AddItem(
                    item.ProductName, 
                    item.Price,
                    item.Quantity, 
                    item.ProductId);
            }

            cart.Clear();

            return order;
        }
    }
}
