import { axiosInstance } from "@/lib/axios.config";
import type { Paginated, Payment, PaymentMethod } from "@/lib/types";

export interface InitializePaymentResponse {
  authorization_url: string;
  reference: string;
  payment: Payment;
}

export const paymentsApi = {
  initialize: (order_id: string, payment_method: PaymentMethod) =>
    axiosInstance.post<InitializePaymentResponse>("/payments/initialize/", { order_id, payment_method }),

  verify: (reference: string) => axiosInstance.get<Payment>(`/payments/verify/${reference}/`),

  list: () => axiosInstance.get<Paginated<Payment>>("/payments/"),
};
