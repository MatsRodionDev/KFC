import { OrderStatus } from '../types';

/** Заказ передан курьеру (Shipped = 4). Учитывает number, string "4", "Shipped". */
export const isOrderShipped = (
  status: OrderStatus | string | number | undefined | null,
): boolean => {
  if (status === undefined || status === null) return false;
  if (status === OrderStatus.Shipped || status === 'Shipped') return true;
  const num = typeof status === 'number' ? status : Number(status);
  return !Number.isNaN(num) && num === OrderStatus.Shipped;
};
