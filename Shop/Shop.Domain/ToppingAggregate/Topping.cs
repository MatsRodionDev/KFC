using Shop.Domain.Abstractions;

namespace Shop.Domain.ToppingAggregate
{
    public class Topping : Entity
    {
        private Topping(
            string name,
            decimal price,
            HashSet<Topping> availableForTypes)
        {
            Name = name;
            Price = price;
            AvailableForTypes = availableForTypes;
        }

        public Topping() { }

        public string Name { get; private set; } = string.Empty;
        public decimal Price { get; private set; }
        public HashSet<Topping> AvailableForTypes { get; private set; } = [];

        public static Topping Create(
            string name,
            decimal price,
            HashSet<Topping> availableForTypes)
        {
            var topping = new Topping(name, price, availableForTypes);

            return topping;
        }
    }
}
