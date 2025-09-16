using Shop.Domain.Abstractions;
using Shop.Domain.Enums;
using Shop.Domain.IngredientAggregate;
using Shop.Domain.ValueObjects;

namespace Shop.Domain.ProductAggregate
{
    public class Product : Aggregate
    {
        private readonly HashSet<ProductIngredient> _productIngredients = new();
        private Product(
            string name,
            string description,
            decimal price,
            ProductCategory productCategory)
        {
            Name = name;
            Description = description;
            Price = price;
            ProductCategory = productCategory;
        }

        private Product(
            string name,
            string description,
            decimal price,
            ProductCategory productCategory,
            Guid userId)
        {
            Name = name;
            Description = description;
            Price = price;
            ProductCategory = productCategory;
        }

        private Product() { }

        public string Name { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public decimal Price { get; private set; }
        public ProductCategory ProductCategory { get; private set; }
        public IReadOnlyList<ProductIngredient> ProductIngredients => [.. _productIngredients];
        public Nutrition ProductNutrition => ProductIngredients.Select(i => i.TotalNutrition).Aggregate((acc, nutrition) => acc + nutrition);
        public Guid? UserId { get; set; }

        public static Product Create(
            string name,
            string description,
            decimal price,
            ProductCategory productCategory,
            (Ingredient baseIngredient, int baseIngredientQuantity)? ingredient)
        {
            var product = new Product(name, description, price, productCategory);

            if(ingredient is not null)
            {
                var (baseIngredient, baseIngredientQuantity) = ingredient.Value;

                product.AddBaseIngredient(
                    baseIngredient,
                    baseIngredientQuantity);
            }

            return product;
        }

        public static Product CreateCustom(
            string name,
            string description,
            decimal price,
            ProductCategory productCategory,
            (Ingredient baseIngredient, int baseIngredientQuantity)? ingredient,
            Guid userId)
        {
            var product = new Product(name, description, price, productCategory, userId);

            if (ingredient is not null)
            {
                var (baseIngredient, baseIngredientQuantity) = ingredient.Value;

                product.AddBaseIngredient(
                    baseIngredient,
                    baseIngredientQuantity);
            }

            return product;
        }

        public ProductIngredient AddIngredient(Ingredient ingredient, int quantity, int minQuantity, int maxQuantity)
        {
            if (ingredient.ForProductCategory is not null 
                && ingredient.ForProductCategory != ProductCategory)
            {
                //Exception
            }

            if (ingredient.IsBase)
            {
                //Exception
            }

            var productIngredient = ProductIngredient.Create(ingredient, Id, quantity, minQuantity, maxQuantity);

            _productIngredients.Add(productIngredient);

            return productIngredient;
        }

        private void AddBaseIngredient(Ingredient ingredient, int quantity)
        {
            if(ingredient.ForProductCategory != ProductCategory)
            {
                //Exception
            }

            if(!ingredient.IsBase)
            {
                //Exception
            }

            var baseIngredient = ProductIngredient.Create(ingredient, Id, quantity, quantity, quantity);

            _productIngredients.Add(baseIngredient);
        }
    }
}
