using Shop.Domain.Exceptions;
using System.Drawing;

namespace Shop.Domain.ValueObjects
{
    public record Nutrition
    {
        public int Calories { get; }
        public int Weight { get; }

        private Nutrition(int calories, int weight)
        {
            if (calories < 0) throw new DomainException("Calories cannot be negative");
            if (weight <= 0) throw new DomainException("Weight must be positive");

            Calories = calories;
            Weight = weight;
        }

        public static Nutrition Of(int calories, int weight) => new Nutrition(calories, weight);

        public Nutrition Multiply(int quantity) => new Nutrition(Calories * quantity, Weight * quantity);

        public static Nutrition operator +(Nutrition a, Nutrition b) => new(a.Weight + b.Weight, a.Calories + b.Calories);
    }
}
