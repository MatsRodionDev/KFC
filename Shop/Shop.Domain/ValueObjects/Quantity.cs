using Shop.Domain.Exceptions;

namespace Shop.Domain.ValueObjects
{
    public record Quantity
    {
        public int Value { get; }

        private Quantity(int value)
        {
            Value = value;
        }

        public static Quantity Create(int value)
        {
            if (value <= 0) throw new DomainException("Quantity must be greater than zero");

            return new Quantity(value);
        }
    }
}
