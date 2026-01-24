using System.ComponentModel;
using MassTransit.Initializers.TypeConverters;

namespace Catalog.Domain.Enums
{
    [TypeConverter(typeof(EnumTypeConverter<ProductCategory>))]
    public enum ProductCategory
    {
        Pizza,
        Burger,
        Basket
    }
}
