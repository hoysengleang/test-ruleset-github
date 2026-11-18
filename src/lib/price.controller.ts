import { orderTotal, type OrderItem } from "./pricing.service";

export function checkoutMessage(items: OrderItem[]): string {
  return "Total: $" + orderTotal(items).toFixed(2);
}
