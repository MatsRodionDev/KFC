using Shop.Domain.Abstractions;
using Shop.Domain.ProductAggregate;
using Shop.Domain.ValueObjects;

namespace Shop.Domain.CartAggregate
{
    public class CartItem : Entity
    {
        private readonly HashSet<CartItemIngredient> _cartItemIngredients = new();

        private CartItem() { }
        private CartItem(
            string productName,
            decimal price,
            Quantity quantity,
            Guid productId,
            Guid cartId)
        {
            ProductName = productName;
            Price = price;
            Quantity = quantity;
            ProductId = productId;
            CartId = cartId;
        }

        public string ProductName { get; private set; } = string.Empty;
        public decimal Price { get; private set; }
        public Quantity Quantity { get; private set; }
        public Guid ProductId { get; private set; }
        public Guid CartId { get; private set; }
        public IReadOnlyList<CartItemIngredient> CartItemIngredients => [.. _cartItemIngredients];

        public static CartItem Create(
            string productName,
            decimal price,
            int quantity,
            Guid productId,
            Guid cartId,
            List<ProductIngredient> productIngredients)
        {
            var cartItem = new CartItem(productName, price, Quantity.Create(quantity), productId, cartId);

            foreach (var productIngredient in productIngredients)
            {
                cartItem.AddCartItemIngredient(productIngredient);
            }

            return cartItem;
        }

        private void AddCartItemIngredient(ProductIngredient productIngredient)
        {
            var cartItemIngredient = CartItemIngredient.Create(productIngredient, Id);

            _cartItemIngredients.Add(cartItemIngredient);
        }

        internal void SetQuantity(int quantity)
        {
            Quantity = Quantity.Create(quantity);
        }
    }
}