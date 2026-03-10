import { ProductCategory } from '../../types';

export interface CatalogControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: ProductCategory | null;
  onCategoryClick: (category: ProductCategory | null) => void;
}

const CATEGORIES: { value: ProductCategory | null; label: string }[] = [
  { value: null, label: 'Все' },
  { value: ProductCategory.Pizza, label: 'Пицца' },
  { value: ProductCategory.Burger, label: 'Бургеры' },
  { value: ProductCategory.Basket, label: 'Корзины' },
];

export function CatalogControls({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryClick,
}: CatalogControlsProps) {
  return (
    <div className="catalog-controls">
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Поиск пиццы, напитков или ингредиентов..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="categories-nav">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={label}
            type="button"
            className={`category-pill ${selectedCategory === value ? 'active' : ''}`}
            onClick={() => onCategoryClick(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
