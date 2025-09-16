using Shop.Domain.Abstractions;
using Shop.Domain.Exceptions;
using Shop.Domain.ProductAggregate;
using Shop.Domain.ValueObjects;

namespace Shop.Domain.CartAggregate
{
    public class CartItemIngredient : Entity
    {
        private CartItemIngredient(
            Guid cartId,
            Guid ingredientId,
            string ingredientName,
            Quantity quantity,
            Quantity minQuantity,
            Quantity maxQuantity,
            Nutrition totalNutrition,
            bool isBase)
        {
            CartId = cartId;
            IngredientId = ingredientId;
            IngredientName = ingredientName;
            Quantity = quantity;
            MinQuantity = minQuantity;
            MaxQuantity = maxQuantity;
            TotalNutrition = totalNutrition;
            IsBase = isBase;
        }

        private CartItemIngredient() { }

        public Guid CartId { get; private set; }
        public Guid IngredientId { get; private set; }
        public string IngredientName { get; private set; }
        public Nutrition TotalNutrition { get; private set; }
        public Quantity Quantity { get; private set; }
        public Quantity MaxQuantity { get; private set; }
        public Quantity MinQuantity { get; private set; }
        public bool IsBase { get; private set; }

        public static CartItemIngredient Create(ProductIngredient ingredient, Guid cartId)
        {
            return new CartItemIngredient(
                cartId,
                ingredient.Id,
                ingredient.IngredientName,
                ingredient.Quantity,
                ingredient.MinQuantity,
                ingredient.MaxQuantity,
                ingredient.TotalNutrition,
                ingredient.IsBase);
        }

        internal void SetQuantity(int quantity)
        {
            if (quantity < MinQuantity.Value 
                || quantity > MaxQuantity.Value)
            {
                throw new DomainException(
                    $"Quantity for ingredient {IngredientName} must be between {MinQuantity.Value} and {MaxQuantity.Value}");
            }

            Quantity = Quantity.Create(quantity);
        }
    }
}