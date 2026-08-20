import { axiosInstance } from "@/lib/axios.config";
import type { Order, OrderStatus, Paginated, VendorOrderItem } from "@/lib/types";

export const ordersApi = {
  checkout: (shipping_address_id: string) =>
    axiosInstance.post<Order>("/orders/checkout/", { shipping_address_id }),

  list: (status?: OrderStatus) => axiosInstance.get<Paginated<Order>>("/orders/", { params: { status } }),

  get: (id: string) => axiosInstance.get<Order>(`/orders/${id}/`),

  cancel: (id: string) => axiosInstance.post<Order>(`/orders/${id}/cancel/`),

  // --- Vendor fulfillment (requires an activated vendor session) ---
  vendorItems: (fulfillment_status?: OrderStatus) =>
    axiosInstance.get<Paginated<VendorOrderItem>>("/orders/vendor/", { params: { fulfillment_status } }),

  advanceVendorItemStatus: (itemId: string, status: OrderStatus) =>
    axiosInstance.post<VendorOrderItem>(`/orders/vendor/${itemId}/status/`, { status }),
};
