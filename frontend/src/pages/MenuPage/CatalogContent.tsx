import { MutableRefObject } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { ProductCategory } from '../../types';
import type { Product } from '../../types';
import { getCategoryName } from './catalogUtils';

export interface CatalogContentProps {
  groupedProducts: Record<ProductCategory, Product[]> | null;
  products: Product[];
  selectedCategory: ProductCategory | null;
  searchQuery: string;
  sectionRefs: MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  addingToCartProductId: string | null;
  onAddToCart: (productId: string) => void;
}

export function CatalogContent({
  groupedProducts,
  products,
  selectedCategory,
  searchQuery,
  sectionRefs,
  addingToCartProductId,
  onAddToCart,
}: CatalogContentProps) {
  const showGrouped = selectedCategory === null && !searchQuery && groupedProducts;

  if (showGrouped && groupedProducts) {
    return (
      <div className="catalog-sections">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => {
          const categoryNum = parseInt(category, 10) as ProductCategory;
          return (
            <div
              key={category}
              ref={(el) => {
                if (sectionRefs.current) sectionRefs.current[categoryNum] = el;
              }}
              data-category={category}
              className="category-section"
            >
              <h2 className="section-title">{getCategoryName(categoryNum)}</h2>
              <div className="catalog-grid">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addingToCartProductId === product.id ? undefined : onAddToCart}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="catalog-grid">
      {products.length === 0 ? (
        <div className="empty-state">Товары не найдены</div>
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addingToCartProductId === product.id ? undefined : onAddToCart}
          />
        ))
      )}
    </div>
  );
}
