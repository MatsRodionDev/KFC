import { CartItem as CartItemType } from '../types';
import './CartItem.css';

interface CartItemProps {
  item: CartItemType;
  onRemove?: (itemId: string) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => void;
}

export const CartItem = ({ item, onRemove, onQuantityChange }: CartItemProps) => {
  const price = item.price ?? item.itemIngredients.reduce((sum, ing) => 
    sum + (ing.quantity + ing.customQuantityDelta) * ing.price, 0
  );
  const totalPrice = price * item.quantity;

  const getImageUrl = () => {
    if (item.imageName) {
      return `http://localhost:9000/catalog/${item.imageName}`;
    }
    return null;
  };

  const getFallbackEmoji = () => {
    // Simple emoji based on name (can be improved with product category)
    if (item.name.toLowerCase().includes('пицц') || item.name.toLowerCase().includes('pizza')) return '🍕';
    if (item.name.toLowerCase().includes('бургер') || item.name.toLowerCase().includes('burger')) return '🍔';
    if (item.name.toLowerCase().includes('напит') || item.name.toLowerCase().includes('drink')) return '🥤';
    return '🍽️';
  };

  const handleQuantityChange = (delta: number) => {
    if (onQuantityChange) {
      const newQuantity = Math.max(1, item.quantity + delta);
      onQuantityChange(item.id, newQuantity);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {getImageUrl() ? (
          <img 
            src={getImageUrl()!} 
            alt={item.name}
            className="cart-item-image-img"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="cart-item-image-fallback" style={{ display: getImageUrl() ? 'none' : 'flex' }}>
          {getFallbackEmoji()}
        </div>
      </div>
      <div className="cart-item-info">
        <h3 className="cart-item-title">{item.name}</h3>
        <p className="cart-item-details">
          {item.itemIngredients.length > 0 ? (
            item.itemIngredients
              .filter(ing => ing.isBase || ing.customQuantityDelta !== 0)
              .map(ing => {
                const totalQuantity = ing.quantity + ing.customQuantityDelta;
                if (ing.customQuantityDelta !== 0) {
                  return `${ing.ingredientName} (доп ${ing.customQuantityDelta > 0 ? '+' : ''}${ing.customQuantityDelta}, итого ${totalQuantity})`;
                }
                return `${ing.ingredientName} (${totalQuantity})`;
              })
              .join(', ') || 'Стандартная комплектация'
          ) : (
            'Стандартная комплектация'
          )}
        </p>
      </div>
      <div className="cart-item-quantity-control">
        <button 
          className="qty-btn" 
          onClick={() => handleQuantityChange(-1)}
          disabled={item.quantity <= 1}
        >
          −
        </button>
        <span className="qty-val">{item.quantity}</span>
        <button 
          className="qty-btn" 
          onClick={() => handleQuantityChange(1)}
        >
          +
        </button>
      </div>
      <div className="cart-item-price">{totalPrice.toFixed(0)} ₽</div>
      {onRemove && (
        <button className="btn-remove" onClick={() => onRemove(item.id)} title="Удалить">
          🗑️
        </button>
      )}
    </div>
  );
};

