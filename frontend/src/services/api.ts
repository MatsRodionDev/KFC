import type {
  Product,
  MenuResponse,
  Ingredient,
  Cart,
  CartAddProductItemCommand,
  SetDeliveryCommand,
  Order,
  OrderCreateCommand,
  AddProductCommand,
  AddCustomProductCommand,
  CreateSessionCommand,
  StripeSession,
  AddressGeocodeResponse,
  GeoStoreResponse,
  AddressPredictionResponse,
  StoreInfo,
  OrderResponse
} from '../types';
import { catalogApi, orderApi, paymentApi, geoApi, chatClientApi } from './apiConfig';

// Catalog API
export const catalogService = {
  // Menu
  getMenu: async (): Promise<MenuResponse> => {
    const response = await catalogApi.get<MenuResponse>('/menus');
    return response.data;
  },

  // Products
  getProduct: async (productId: string): Promise<Product> => {
    const response = await catalogApi.get<Product>(`/products/${productId}`);
    return response.data;
  },

  getCustomProducts: async (userId: string): Promise<Product[]> => {
    const response = await catalogApi.get<Product[]>(`/products/custom/${userId}`);
    return response.data;
  },

  addProduct: async (command: AddProductCommand): Promise<string> => {
    const response = await catalogApi.post<string>('/products', command);
    return response.data;
  },

  addCustomProduct: async (command: AddCustomProductCommand): Promise<string> => {
    const response = await catalogApi.post<string>('/products/custom', command);
    return response.data;
  },

  // Ingredients
  getIngredient: async (ingredientId: string): Promise<Ingredient> => {
    const response = await catalogApi.get<Ingredient>(`/ingredients/${ingredientId}`);
    return response.data;
  },

  getIngredientsByCategory: async (category: number): Promise<Ingredient[]> => {
    const response = await catalogApi.get<Ingredient[]>(`/ingredients/${category}`);
    return response.data;
  },

  createIngredient: async (command: {
    name: string;
    price: number;
    weight: number;
    calories: number;
    availableForProductCategories: number[];
  }): Promise<string> => {
    const response = await catalogApi.post<string>('/ingredients', command);
    return response.data;
  }
};

// Order Service API
export const orderService = {
  // Cart
  getCart: async (userId: string): Promise<Cart> => {
    const response = await orderApi.get<Cart>(`/carts/${userId}`);
    return response.data;
  },

  addItemToCart: async (command: CartAddProductItemCommand): Promise<string> => {
    const response = await orderApi.post<string>('/carts/items', command);
    return response.data;
  },

  setDeliveryAddress: async (command: SetDeliveryCommand): Promise<string> => {
    const response = await orderApi.post<string>('/carts/address', command);
    return response.data;
  },

  // Orders
  createOrder: async (command: OrderCreateCommand): Promise<Order> => {
    const response = await orderApi.post<Order>('/orders', command);
    return response.data;
  },

  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    const response = await orderApi.post<Order[]>('/orders/by_userid', { customerId: userId });
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await orderApi.get<Order>(`/orders/${orderId}`);
    return response.data;
  }
};

// Payment Service API
export const paymentService = {
  createSession: async (command: CreateSessionCommand): Promise<StripeSession> => {
    try {
      console.log('Sending createSession request:', command);
      const response = await paymentApi.post<StripeSession>('/sessions', command);
      console.log('Payment service response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Payment service error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },
  getSession: async (sessionId: string): Promise<StripeSession> => {
    const response = await paymentApi.get<StripeSession>(`/sessions/${sessionId}`);
    return response.data;
  }
};

// Geo Service API
export const geoService = {
  getAddressInfo: async (address: string): Promise<AddressGeocodeResponse> => {
    const response = await geoApi.get<AddressGeocodeResponse>('/address', {
      params: { address }
    });
    return response.data;
  },

  getStoresInRadius: async (latitude: number, longitude: number, radius: number = 15): Promise<GeoStoreResponse[]> => {
    const response = await geoApi.get<GeoStoreResponse[]>('/stres/radius', {
      params: { latitude, longitude, radius }
    });
    return response.data;
  },

  getStoreByAddress: async (address: string): Promise<StoreInfo> => {
    const response = await geoApi.get<StoreInfo>('/stores', {
      params: { address }
    });
    return response.data;
  },

  getPredictions: async (query: string, city?: string): Promise<AddressPredictionResponse> => {
    const response = await geoApi.get<AddressPredictionResponse>('/predictions', {
      params: { query, city }
    });
    return response.data;
  }
};

// ChatClient API
export const chatService = {
  start: async (text: string): Promise<OrderResponse> => {
    // ASP.NET Core [FromBody] string expects JSON string (quoted string)
    const response = await chatClientApi.post<OrderResponse>('/workflows/start', JSON.stringify(text), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
};

