using Catalog.Domain.Abstractions;
using Catalog.Domain.Enums;
using Catalog.Domain.Exceptions;
using Catalog.Domain.ValueObjects;

namespace Catalog.Domain.IngredientAggregate
{
    public class Ingredient : Aggregate
    {
        private readonly List<ProductCategory> _availableForProductCategory = [];
        
        private Ingredient(
            string name,
            decimal price,
            Nutrition nutrition,
            bool isBase,
            ProductCategory? forProductCategory)
        {
            Name = name;
            Price = price;
            Nutrition = nutrition;
            IsBase = isBase;
            ForProductCategory = forProductCategory;
        }

        private Ingredient() { }

        public string Name { get; private set; }
        public decimal Price { get; private set; }
        public Nutrition Nutrition { get; private set; }
        public bool IsBase { get; private set; }
        public ProductCategory? ForProductCategory { get; private set; }
        public string? ImageName { get; private set; }
        public IReadOnlyList<ProductCategory> AvailableForProductCategory => [.. _availableForProductCategory];

        public static Ingredient Create(string name, decimal price, int weight, int calories)
        {
            return new Ingredient(
                name,
                price,
                Nutrition.Of(calories, weight),
                false,
                null);
        }

        public static Ingredient CreateBase(string name, decimal price, int weight, int calories, ProductCategory forProductCategory)
        {
            return new Ingredient(
                name,
                price,
                Nutrition.Of(calories, weight),
                true,
                forProductCategory);
        }

        public void AddAvailableForProductCategory(ProductCategory productCategory)
        {
            if (IsBase)
            {
                throw new DomainException("You cannot add available product categories to base ingredient.");
            }

            if (_availableForProductCategory.Contains(productCategory))
            {
                throw new DomainException("You cannot add the same available product categories to ingredient.");
            }
            
            _availableForProductCategory.Add(productCategory);
        }
        
        public void AddImage(string imageName)
        {
            ImageName = imageName;
        }
    }
}
