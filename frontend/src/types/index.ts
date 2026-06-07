// Product types
export enum ProductCategory {
  Pizza = 0,
  Burger = 1,
  Basket = 2
}

export interface Nutrition {
  calories: number;
  weight: number;
}

export interface Quantity {
  value: number;
}

export interface ProductIngredient {
  ingredientId: string;
  ingredientName: string;
  price: number;
  imageName?: string;
  quantity: Quantity | number; // Может приходить как число или объект
  minQuantity: Quantity | number;
  maxQuantity: Quantity | number;
  isBase: boolean;
  totalNutrition?: Nutrition; // Может не приходить
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number | null;
  ingredientsPrice?: number; // Может не приходить с сервера (вычисляемое свойство)
  productCategory: ProductCategory | string; // Может приходить как строка
  nutrition?: Nutrition; // Может не приходить (вычисляемое свойство)
  imageName?: string;
  userId: string | null;
  productIngredients: ProductIngredient[];
}

export interface MenuResponse {
  products: Product[];
}

// Ingredient types
export interface Ingredient {
  id: string;
  name: string;
  price: number;
  weight: number;
  calories: number;
  isBase: boolean;
  imageName?: string;
  forProductCategory: ProductCategory | null;
  availableForProductCategories: ProductCategory[];
}

// Cart types
export interface CartItemIngredient {
  ingredientId: string;
  ingredientName: string;
  price: number;
  imageName?: string;
  customQuantityDelta: number;
  quantity: number;
  maxQuantity: number;
  minQuantity: number;
  isBase: boolean;
}

export interface CartItem {
  id: string;
  cartId: string;
  userId: string | null;
  productId: string;
  name: string;
  price: number | null;
  imageName?: string;
  quantity: number;
  itemIngredients: CartItemIngredient[];
}

export interface AddressComponents {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
}

export interface AddressCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressGeocodeResponse {
  address: string;
  components: AddressComponents;
  coordinates: AddressCoordinates;
  uri?: string;
}

export interface StoreInfo {
  storeId: string;
  address: AddressGeocodeResponse;
}

export interface Delivery {
  serviceType: ServiceType;
  address?: AddressGeocodeResponse;
  storeAddressInfo?: StoreInfo;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export enum ServiceType {
  ClickCollect = 0,
  Delivery = 1
}

export interface Cart {
  id: string;
  userId: string;
  totalPrice?: number; // Может вычисляться на клиенте
  delivery: Delivery;
  items: CartItem[];
}

// Order types
export enum OrderStatus {
  Created = 0,
  Paid = 1,
  Cooking = 2,
  Ready = 3,
  Shipped = 4,
  Cancelled = 5,
  Delivered = 6
}

export interface OrderItemIngredient {
  name: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  itemIngredients: OrderItemIngredient[];
}

export enum PaymentMethod {
  Card = 0,
  Cash = 1
}

export enum PaymentStatus {
  Pending = 0,
  Canceled = 1,
  Expired = 2,
  Completed = 3
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  orderId: string;
  checkoutId: string;
  customerId: string;
  status?: PaymentStatus;
  occuredAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amountTotal: number;
  paid: boolean;
  checkoutId?: string;
  status?: PaymentStatus;
  paymentEvents?: PaymentEvent[];
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus | string;
  delivery: Delivery;
  payment?: Payment;
  items: OrderItem[];
  createdAt?: string;
}

// Command/Query types
export interface IngredientSnapshot {
  ingredientId: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface AddProductCommand {
  name: string;
  description: string;
  price: number | null;
  productCategory: ProductCategory;
  baseIngredient: IngredientSnapshot | null;
  ingredients: IngredientSnapshot[];
}

export interface AddCustomProductCommand {
  name: string;
  description: string;
  userId: string;
  productCategory: ProductCategory;
  baseIngredient: IngredientSnapshot;
  ingredients: IngredientSnapshot[];
}

export interface CartAddProductItemCommand {
  userId: string;
  productId: string;
  quantity: number;
  ingredientsQuantityCustomizations: IngredientQuantityCustomization[];
}

export interface IngredientQuantityCustomization {
  ingredientId: string;
  delta: number;
}

export interface SetDeliveryCommand {
  userId: string;
  address: string;
  serviceType?: number;
  storeId?: string;
}

export interface OrderCreateCommand {
  userId: string;
}

// ChatClient types
export interface CustomIngredient {
  name: string;
  quantity: number;
  delta: number;
  comment?: string | null;
}

export interface OrderDto {
  productId: string;
  name: string;
  quantity: number;
  customIngredients?: CustomIngredient[] | null;
}

export interface OrderResponse {
  products: OrderDto[];
  comment?: string | null;
}

export interface CreateSessionCommand {
  orderId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeSession {
  id: string;
  url?: string;
  Url?: string; // Stripe может возвращать с большой буквы
  customerId?: string;
  customerEmail?: string;
  amountTotal?: number;
  currency?: string;
}

// Geo API types
export interface GeoStoreResponse {
  address: string;
  distance: number;
  coordinates: AddressCoordinates;
}

export interface AddressPrediction {
  address: string;
  structured: {
    mainText: string;
    secondaryText: string;
  };
  uri?: string;
}

export interface AddressPredictionResponse {
  predictions: AddressPrediction[];
  count: number;
}

