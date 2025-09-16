using Shop.Domain.Abstractions;
using Shop.Domain.Enums;
using Shop.Domain.ValueObjects;

namespace Shop.Domain.IngredientAggregate
{
    public class Ingredient : Aggregate
    {
        private Ingredient(
            string name,
            Nutrition nutrition,
            bool isBase,
            ProductCategory? forProductCategory)
        {
            Name = name;
            Nutrition = nutrition;
            IsBase = isBase;
            ForProductCategory = forProductCategory;
        }

        private Ingredient() { }

        public string Name { get; private set; }
        public Nutrition Nutrition { get; private set; }
        public bool IsBase { get; private set; }
        public ProductCategory? ForProductCategory { get; private set; }

        public Ingredient Create(string name, int weight, int calories, ProductCategory? forProductCategory)
        {
            return new Ingredient(
                name,
                Nutrition.Of(calories, weight),
                false,
                forProductCategory);
        }

        public Ingredient CreateBase(string name, int weight, int calories, ProductCategory forProductCategory)
        {
            return new Ingredient(
                name,
                Nutrition.Of(calories, weight),
                true,
                forProductCategory);
        }
    }
}
