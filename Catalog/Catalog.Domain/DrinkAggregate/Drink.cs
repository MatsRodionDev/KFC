using Catalog.Domain.Abstractions;
using Catalog.Domain.Exceptions;
using Catalog.Domain.ToppingAggregate;
using Shop.Domain.Enums;

namespace Catalog.Domain.DrinkAggregate
{
    public class Drink : Aggregate
    {
        private readonly HashSet<DrinkTopping> _drinkToppings = [];
        
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
        public string? ImageName { get; private set; }
        public IReadOnlyCollection<DrinkTopping> DrinkToppings => _drinkToppings;

        public static Drink Create(
            string name,
            string description,
            decimal price,
            DrinkType type)
        {
            var drink = new Drink(name, description, price, type);

            return drink;
        }

        public DrinkTopping AddTopping(Topping topping)
        {
            if (!topping.AvailableForTypes.Contains(Type))
            {
                throw new DomainException($"This topping does not available for this type of drink");
            }
            
            var drinkTopping = DrinkTopping.Create(topping, Id);
            _drinkToppings.Add(drinkTopping);
            
            return drinkTopping;
        }
        
        public void AddImage(string imageName)
        {
            ImageName = imageName;
        }
    }

    public class DrinkTopping : Entity
    {
        private DrinkTopping(
            string name,
            decimal price,
            string? imageName,
            Guid toppingId,
            Guid drinkId)
        {
            Name = name;    
            Price = price;
            ImageName = imageName;
            ToppingId = toppingId;
            DrinkId = drinkId;
        }
        
        public string Name { get; private set; }
        public decimal Price { get; private set; }
        public string? ImageName { get; set; }
        public Guid ToppingId { get; private set; }
        public Guid DrinkId { get; private set; }
        
        public static DrinkTopping Create(
            Topping topping,
            Guid drinkId)
        {
            var drinkTopping = new DrinkTopping(
                topping.Name, 
                topping.Price,
                topping.ImageName,
                topping.Id,
                drinkId);
            
            return drinkTopping;
        }
    }
}
