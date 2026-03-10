import { ProductCategory } from '../../types';
import type { Product } from '../../types';

export function getCategoryName(category: ProductCategory): string {
  switch (category) {
    case ProductCategory.Pizza:
      return 'Пицца';
    case ProductCategory.Burger:
      return 'Бургеры';
    case ProductCategory.Basket:
      return 'Корзины';
    default:
      return '';
  }
}

export function groupProductsByCategory(products: Product[]): Record<ProductCategory, Product[]> {
  return products.reduce((acc, product) => {
    const category =
      product.productCategory === 0 || product.productCategory === 'Pizza' || product.productCategory === '0'
        ? ProductCategory.Pizza
        : product.productCategory === 1 || product.productCategory === 'Burger' || product.productCategory === '1'
          ? ProductCategory.Burger
          : ProductCategory.Basket;
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<ProductCategory, Product[]>);
}
