import { axiosInstance } from "@/lib/axios.config";
import type { Cart, CartItem } from "@/lib/types";

export const cartApi = {
  get: () => axiosInstance.get<Cart>("/cart/"),

  /** Adds product_id or increments quantity if already present. */
  addItem: (product_id: string, quantity: number = 1) =>
    axiosInstance.post<CartItem>("/cart/items/", { product_id, quantity }),

  updateItem: (itemId: string, quantity: number) =>
    axiosInstance.patch<CartItem>(`/cart/items/${itemId}/`, { quantity }),

  removeItem: (itemId: string) => axiosInstance.delete(`/cart/items/${itemId}/`),

  clear: () => axiosInstance.delete("/cart/clear/"),
};
