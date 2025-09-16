using Shop.Domain.Abstractions;
using Shop.Domain.Exceptions;
using Shop.Domain.ProductAggregate;

namespace Shop.Domain.CartAggregate
{
    public class Cart : Aggregate
    {
        private readonly HashSet<CartItem> _items = new();

        private Cart() { }
        private Cart(Guid userId)
        {
            UserId = userId;
        }

        public Guid UserId { get; private set; }
        public decimal TotalAmount => _items.Sum(i => i.Price * i.Quantity.Value);
        public IReadOnlyList<CartItem> Items => [.. _items];

        public static Cart Create(Guid userId)
        {
            return new Cart(userId);
        }

        public CartItem AddItem(Product product, int quantity)
        {
            var existedCartItem = _items
                .Where(i => i.Id == product.Id)
                .Where(i => i.CartItemIngredients.Any() is false)
                .SingleOrDefault();

            if (existedCartItem is not null)
            {
                existedCartItem.SetQuantity(quantity + existedCartItem.Quantity.Value);
                return existedCartItem;
            }

            var item = CartItem.Create(
                product.Name,
                product.Price,
                quantity,
                product.Id,
                Id,
                [.. product.ProductIngredients]);

            _items.Add(item);

            return item;
        }

        public void RemoveItem(Guid itemId)
        {
            var item = Items
                .FirstOrDefault(i => i.Id == itemId);

            if (item is not null)
            {
                _items.Remove(item);
            }
        }

        public void UpdateItemQuantity(Guid itemId, int quantity)
        {
            var item = Items.FirstOrDefault(i => i.Id == itemId);

            if (item is null)
            {
                throw new DomainException($"Could not find item {itemId}");
            }

            item.SetQuantity(quantity);
        }

        public void UpdateItemIngredientQuantity(Guid itemId, Guid ingredientId, int quantity)
        {
            var item = Items.FirstOrDefault(i => i.Id == itemId);

            if (item is null)
            {
                throw new DomainException($"Could not find item {itemId}");
            }

            var ingredient = item.CartItemIngredients.FirstOrDefault(i => i.IngredientId == ingredientId);

            if (ingredient is null)
            {
                throw new DomainException($"Could not find ingredient {ingredientId} in item {itemId}");
            }

            ingredient.SetQuantity(quantity);
        }

        public void Clear()
        {
            _items.Clear();
        }
    }
}