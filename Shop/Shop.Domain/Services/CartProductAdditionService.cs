using Shop.Domain.CartAggregate;
using Shop.Domain.Exceptions;
using Shop.Domain.ProductAggregate;

namespace Shop.Domain.Services
{
    public sealed class CartProductAdditionService
    {
        public CartItem AddProduct(Cart cart, Product product, int quantity)
        {
            var item = cart.Items.FirstOrDefault(i => i.ProductId == product.Id);

            if (quantity > product.StockQuantity
                || (item is not null
                && item.Quantity + quantity > product.StockQuantity))
            {
                throw new DomainException("There is no product in such quantity");
            }

            return cart.AddItem(product.Name, product.Price, product.Id, quantity);
        }
    }
}
