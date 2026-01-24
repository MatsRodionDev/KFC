import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/api';
import type { Cart } from '../types';
import { DEFAULT_USER_ID } from '../constants';

export const useCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await orderService.getCart(DEFAULT_USER_ID);
      // Убеждаемся, что items всегда массив
      if (cartData && !cartData.items) {
        cartData.items = [];
      }
      setCart(cartData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cart';
      setError(errorMessage);
      console.error('Error fetching cart:', err);
      // При ошибке создаем пустую корзину
      setCart({
        id: '',
        userId: DEFAULT_USER_ID,
        totalPrice: 0,
        delivery: {
          serviceType: 0
        },
        items: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const refreshCart = useCallback(() => {
    return fetchCart();
  }, [fetchCart]);

  const calculateTotalPrice = (cart: Cart | null): number => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    if (cart.totalPrice !== undefined) return cart.totalPrice;
    return cart.items.reduce((sum, item) => {
      const itemPrice = item.price ?? item.itemIngredients.reduce((ingSum, ing) => 
        ingSum + (ing.quantity + ing.customQuantityDelta) * ing.price, 0
      );
      return sum + itemPrice * item.quantity;
    }, 0);
  };

  return {
    cart,
    loading,
    error,
    refreshCart,
    itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    totalPrice: calculateTotalPrice(cart)
  };
};

