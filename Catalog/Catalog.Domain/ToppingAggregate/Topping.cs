using Catalog.Domain.Abstractions;
using Shop.Domain.Enums;

namespace Catalog.Domain.ToppingAggregate
{
    public class Topping : Entity
    {
        private Topping(
            string name,
            decimal price,
            List<DrinkType> availableForTypes)
        {
            Name = name;
            Price = price;
            AvailableForTypes = availableForTypes;
        }

        public Topping() { }

        public string Name { get; private set; } = string.Empty;
        public decimal Price { get; private set; }
        public List<DrinkType> AvailableForTypes { get; private set; } = [];

        public static Topping Create(
            string name,
            decimal price,
            List<DrinkType> availableForTypes)
        {
            var topping = new Topping(name, price, availableForTypes);

            return topping;
        }
    }
}
