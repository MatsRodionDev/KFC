using Catalog.Domain.Abstractions;
using Catalog.Domain.IngredientAggregate;
using Catalog.Domain.ValueObjects;

namespace Catalog.Domain.ProductAggregate
{
    public class ProductIngredient : Entity
    {
        private ProductIngredient(
            Guid productId,
            Guid ingredientId,
            string ingredientName,
            decimal price,
            Quantity quantity,
            Quantity minQuantity,
            Quantity maxQuantity,
            Nutrition totalNutrition,
            bool isBase)
        {
            ProductId = productId;
            IngredientId = ingredientId;
            IngredientName = ingredientName;
            Price = price;
            Quantity = quantity;
            MinQuantity = minQuantity;
            MaxQuantity = maxQuantity;
            TotalNutrition = totalNutrition;
            IsBase = isBase;
        }

        private ProductIngredient() { }

        public Guid ProductId { get; private set; }
        public Guid IngredientId { get; private set; }
        public string IngredientName { get; private set; }
        public decimal Price { get; private set; }
        public Nutrition TotalNutrition { get; private set; }
        public Quantity Quantity { get; private set; }
        public Quantity MaxQuantity { get; private set; }
        public Quantity MinQuantity { get; private set; }
        public bool IsBase { get; private set; }

        public static ProductIngredient Create(Ingredient ingredient, Guid productId, int quantity, int minQuantity, int maxQuantity)
        {
            var totalNutrition = ingredient.Nutrition.Multiply(quantity);

            return new ProductIngredient(
                productId,
                ingredient.Id,
                ingredient.Name,
                ingredient.Price,
                Quantity.Create(quantity),
                Quantity.Create(minQuantity),
                Quantity.Create(maxQuantity),
                totalNutrition,
                ingredient.IsBase);
        }
    }
}
