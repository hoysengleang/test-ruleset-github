export type OrderItem = {
  price: number;
  quantity: number;
};

export const DISCOUNT_THRESHOLD = 100;

export const DISCOUNT_RATE = 0.1;

export function subtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    if (item.price < 0 || item.quantity < 0) {
      throw new Error("Price and quantity must not be negative");
    }
    return sum + item.price * item.quantity;
  }, 0);
}


export function orderTotal(items: OrderItem[]): number {
  const sub = subtotal(items);
  const discount = sub > DISCOUNT_THRESHOLD ? sub * DISCOUNT_RATE : 0;
  return Math.round((sub - discount) * 100) / 100;
}
