using Shop.Domain.Abstractions;
using Shop.Domain.IngredientAggregate;
using Shop.Domain.ValueObjects;

namespace Shop.Domain.ProductAggregate
{
    public class ProductIngredient : Entity
    {
        private ProductIngredient(
            Guid productId,
            Guid ingredientId,
            string ingredientName,
            Quantity quantity,
            Quantity minQuantity,
            Quantity maxQuantity,
            Nutrition totalNutrition)
        {
            ProductId = productId;
            IngredientId = ingredientId;
            IngredientName = ingredientName;
            Quantity = quantity;
            TotalNutrition = totalNutrition;
        }

        private ProductIngredient() { }

        public Guid ProductId { get; private set; }
        public Guid IngredientId { get; private set; }
        public string IngredientName { get; private set; }
        public Nutrition TotalNutrition { get; private set; }
        public Quantity Quantity { get; private set; }
        public Quantity MaxQuantity { get; private set; }
        public Quantity MinQuantity { get; private set; }
        public bool IsBase { get; set; }

        public static ProductIngredient Create(Ingredient ingredient, Guid productId, int quantity, int minQuantity, int maxQuantity)
        {
            var totalNutrition = ingredient.Nutrition.Multiply(quantity);

            return new ProductIngredient(
                productId,
                ingredient.Id,
                ingredient.Name,
                Quantity.Create(quantity),
                Quantity.Create(minQuantity),
                Quantity.Create(maxQuantity),
                totalNutrition);
        }
    }
}
