using Catalog.Domain.Enums;
using Catalog.Domain.Exceptions;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ProductAggregate;

namespace Catalog.Domain.Services
{
    public class ProductAdditionService(IIngredientRepository ingredientRepository)
    {
        public async Task AddProduct(
            string name,
            string description,
            decimal price,
            ProductCategory productCategory,
            Guid? baseIngredienttId,
            CancellationToken cancellationToken = default)
        {
            Product? product = default;

            if(baseIngredienttId is not null)
            {
                var baseIngredient = await ingredientRepository.GetByIdAsync(baseIngredienttId.Value, cancellationToken);

                if(baseIngredient is null)
                {
                    throw new DomainException("There is no such base ingredient");
                }

                product = Product.Create(name, description, price, productCategory, (baseIngredient, 1), null);
            }

            product ??= Product.Create(name, description, price, productCategory, null, null);
        }
    }
}
