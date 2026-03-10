import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  selectCart, 
  selectCartLoading, 
  selectCartError,
  selectCartTotalPrice,
  fetchCart 
} from '../../store/slices/cartSlice';
import { CartItem } from '../../components/CartItem';
import { useUserId } from '../../hooks/useUserId';
import './CartPage.css';

export const CartPage = () => {
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const cart = useAppSelector(selectCart);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchCart(userId));
  }, [dispatch, userId]);

  const handleRemoveItem = async () => {
    // TODO: Implement remove item API call when available
    // For now, just refresh cart
    await dispatch(fetchCart(userId));
  };

  const handleQuantityChange = async () => {
    // TODO: Implement update quantity API call when available
    // For now, just refresh cart
    await dispatch(fetchCart(userId));
  };

  const handleGoToCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Корзина</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Корзина</h1>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-title">Произошла ошибка</p>
          <p className="error-message">{error}</p>
          <button onClick={() => dispatch(fetchCart(userId))} className="btn-primary" style={{ marginTop: '20px' }}>
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container">
        <h1>Корзина</h1>
        <div className="empty-cart">
          <p>Ваша корзина пуста</p>
          <p style={{ fontSize: '15px', color: '#666', marginTop: '12px', lineHeight: '1.6' }}>
            Добавьте товары из каталога, чтобы они появились здесь
          </p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '24px' }}>
            🛍️ Перейти в каталог
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page-container">
      <h1>Корзина</h1>

      <div className="cart-layout">
        <div>
          <div className="cart-items-header">
            <h2>Товары в корзине ({cart.items.length})</h2>
          </div>
          <div className="cart-items">
            {cart.items.map((item) => (
              <CartItem 
                key={item.id} 
                item={item}
                onRemove={handleRemoveItem}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>
        </div>

        <div className="cart-summary">
          <div className="summary-header">
          <h2 className="summary-title">Итого</h2>
            <div className="summary-items-count">{cart.items.length} {cart.items.length === 1 ? 'товар' : cart.items.length < 5 ? 'товара' : 'товаров'}</div>
          </div>

          <div className="summary-section">
            <div className="summary-stats">
            <div className="summary-row">
                <span className="summary-label">Товаров в заказе</span>
                <span className="summary-value">{cart.items.length} шт.</span>
            </div>
            <div className="summary-row">
                <span className="summary-label">Количество позиций</span>
                <span className="summary-value">{cart.items.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
              </div>
            </div>
            <div className="summary-row total">
              <span className="total-label">Итого к оплате</span>
              <span className="total-price">
                {totalPrice.toFixed(0)} ₽
              </span>
            </div>
          </div>

          <div className="summary-button-wrapper">
          <button
            className="btn-checkout"
            onClick={handleGoToCheckout}
          >
            Оформить заказ
              <span className="btn-checkout-arrow">→</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

