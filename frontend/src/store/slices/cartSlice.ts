import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../services/api';
import { Cart } from '../../types';
import { DEFAULT_USER_ID } from '../../constants';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

// Async thunks для работы с API
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (userId: string = DEFAULT_USER_ID, { rejectWithValue }) => {
    try {
      const cartData = await orderService.getCart(userId);
      // Убеждаемся, что items всегда массив
      if (cartData && !cartData.items) {
        cartData.items = [];
      }
      return cartData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart';
      console.error('Error fetching cart:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (
    params: {
      userId: string;
      productId: string;
      quantity: number;
      customizations: Array<{ ingredientId: string; delta: number }>;
    },
    { rejectWithValue }
  ) => {
    try {
      await orderService.addItemToCart({
        userId: params.userId,
        productId: params.productId,
        quantity: params.quantity,
        ingredientsQuantityCustomizations: params.customizations,
      });
      const cartData = await orderService.getCart(params.userId);
      return cartData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart';
      console.error('Error adding to cart:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Note: updateCartItemQuantity and removeCartItem are not implemented in the API yet
// They will need to be added when the backend supports these operations

export const setDeliveryAddress = createAsyncThunk(
  'cart/setDeliveryAddress',
  async (
    params: {
      userId: string;
      address: string;
      serviceType?: number;
      storeId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await orderService.setDeliveryAddress({
        userId: params.userId,
        address: params.address,
        serviceType: params.serviceType,
        storeId: params.storeId,
      });
      const cartData = await orderService.getCart(params.userId);
      return cartData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set delivery address';
      console.error('Error setting delivery address:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.cart = {
        id: '',
        userId: DEFAULT_USER_ID,
        totalPrice: 0,
        delivery: {
          serviceType: 0,
        },
        items: [],
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCart
    builder.addCase(fetchCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCart.fulfilled, (state, action: PayloadAction<Cart>) => {
      state.loading = false;
      state.cart = action.payload;
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      // При ошибке создаем пустую корзину
      state.cart = {
        id: '',
        userId: DEFAULT_USER_ID,
        totalPrice: 0,
        delivery: {
          serviceType: 0,
        },
        items: [],
      };
    });

    // addToCart
    builder.addCase(addToCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addToCart.fulfilled, (state, action: PayloadAction<Cart>) => {
      state.loading = false;
      state.cart = action.payload;
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // setDeliveryAddress
    builder.addCase(setDeliveryAddress.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(setDeliveryAddress.fulfilled, (state, action: PayloadAction<Cart>) => {
      state.loading = false;
      state.cart = action.payload;
    });
    builder.addCase(setDeliveryAddress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
export const selectCartTotalPrice = (state: { cart: CartState }) => {
  const cart = state.cart.cart;
  if (!cart || !cart.items || cart.items.length === 0) return 0;
  if (cart.totalPrice !== undefined) return cart.totalPrice;
  return cart.items.reduce((sum, item) => {
    const itemPrice =
      item.price ??
      item.itemIngredients.reduce(
        (ingSum, ing) => ingSum + (ing.quantity + ing.customQuantityDelta) * ing.price,
        0
      );
    return sum + itemPrice * item.quantity;
  }, 0);
};

export const { clearCart, clearError } = cartSlice.actions;
export default cartSlice.reducer;

