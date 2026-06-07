import { Link } from 'react-router-dom';
import { Product, ProductCategory } from '../types';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const price = product.price ?? product.ingredientsPrice ?? 0;
  const priceText = product.price ? `от ${price.toFixed(0)} ₽` : `${price.toFixed(0)} ₽`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };

  const getImageUrl = () => {
    if (product.imageName) {
      return `http://localhost:9000/catalog/${product.imageName}`;
    }
    return null;
  };

  const getFallbackEmoji = () => {
    const category = typeof product.productCategory === 'string' 
      ? product.productCategory 
      : ProductCategory[product.productCategory];
    if (category === 'Pizza' || category === '0' || product.productCategory === 0) return '🍕';
    if (category === 'Burger' || category === '1' || product.productCategory === 1) return '🍔';
    return '🧺';
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-container">
        {getImageUrl() ? (
          <img 
            src={getImageUrl()!} 
            alt={product.name}
            className="product-image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="product-image-fallback" style={{ display: getImageUrl() ? 'none' : 'flex' }}>
          {getFallbackEmoji()}
        </div>
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{priceText}</span>
          <button className="btn-add-to-cart" onClick={handleAddToCart}>
            В корзину
          </button>
        </div>
      </div>
    </Link>
  );
};

