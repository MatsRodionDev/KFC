export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  addressA: string;
  addressB: string;
  price: number;
  distance: string;
  status: 'new' | 'accepted' | 'arrived_a' | 'picked_up' | 'arrived_b' | 'delivered';
  pickupCoords: { latitude: number; longitude: number };
  destinationCoords: { latitude: number; longitude: number };
  deliveryPhotoUri?: string;
  items: OrderItem[];
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  OrderDetails: { order: Order };
  History: undefined;
  Chat: { orderId: string; courierName: string; clientName: string };
  Achievements: undefined;
};
