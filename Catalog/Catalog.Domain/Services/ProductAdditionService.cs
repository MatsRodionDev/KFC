using Catalog.Domain.Enums;
using Catalog.Domain.Exceptions;
using Catalog.Domain.Interfaces.Repositories;
using Catalog.Domain.ProductAggregate;

namespace Catalog.Domain.Services
{
    public class ProductAdditionService(IIngredientRepository ingredientRepository)
    {
        private readonly HashSet<ProductCategory> _categories = [ProductCategory.Burger, ProductCategory.Basket, ProductCategory.Pizza];
        
        public async Task<Product> Add(
            string name,
            string description,
            decimal? price,
            ProductCategory productCategory,
            IngredientSnapshot? baseIngredientSnapshot,
            List<IngredientSnapshot> ingredientsSnapshots,
            CancellationToken cancellationToken = default)
        {
            return await Add(name, 
                description, 
                price, 
                productCategory, 
                baseIngredientSnapshot, 
                ingredientsSnapshots, 
                null, 
                cancellationToken);
        }

        public async Task<Product> AddCustom(
            string name,
            string description,
            ProductCategory productCategory,
            IngredientSnapshot baseIngredientSnapshot,
            List<IngredientSnapshot> ingredientsSnapshots,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            if (!_categories.Contains(productCategory))
            {
                throw new DomainException("Custom product with such product category cannot be created");
            }
            
            return await Add(name, 
                description, 
                default, 
                productCategory, 
                baseIngredientSnapshot, 
                ingredientsSnapshots,
                userId,
                cancellationToken);
        }

        private async Task<Product> Add(
            string name,
            string description,
            decimal? price,
            ProductCategory productCategory,
            IngredientSnapshot? baseIngredientSnapshot,
            List<IngredientSnapshot> ingredientsSnapshots,
            Guid? userId,
            CancellationToken cancellationToken = default)
        {
            Product? product = default;

            if(baseIngredientSnapshot is not null)
            {
                var baseIngredient = await ingredientRepository
                    .GetByIdAsync(baseIngredientSnapshot.IngredientId, cancellationToken);

                if(baseIngredient is null)
                {
                    throw new DomainException("There is no such base ingredient");
                }

                product = Product.Create(name, description, price, productCategory, (baseIngredient, 1), userId);
            }

            product ??= Product.Create(name, description, price, productCategory, null, null);
            
            var ingredientsIds = ingredientsSnapshots.Select(s => s.IngredientId).ToList();
            var ingredientsDictionary = (await ingredientRepository.GetByIdsAsync(ingredientsIds, cancellationToken)).ToDictionary(x => x.Id);

            foreach (var ingredientSnapshot in ingredientsSnapshots)
            {
                if (!ingredientsDictionary.TryGetValue(ingredientSnapshot.IngredientId, out var ingredient))
                {
                    throw new DomainException("There is no such ingredient");
                }
                
                product.AddIngredient(
                    ingredient, 
                    ingredientSnapshot.Quantity, 
                    ingredientSnapshot.MinQuantity, 
                    ingredientSnapshot.MaxQuantity);
            }
            
            return product;
        }
    }
}
