using Catalog.Domain.Abstractions;
using Shop.Domain.Enums;

namespace Catalog.Domain.DrinkAggregate
{
    public class Drink : Aggregate
    {
        private Drink(
            string name,
            string description,
            decimal price,
            DrinkType type)
        {
            Name = name;
            Description = description;
            Price = price;
            Type = type;
        }

        public Drink() { }

        public string Name { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public decimal Price { get; private set; }
        public DrinkType Type { get; private set; }

        public static Drink Create(
            string name,
            string description,
            decimal price,
            DrinkType type)
        {
            var drink = new Drink(name, description, price, type);

            return drink;
        }
    }
}
