import { axiosInstance } from "@/lib/axios.config";
import type { Paginated, Review } from "@/lib/types";

export const reviewsApi = {
  listForProduct: (productId: string) =>
    axiosInstance.get<Paginated<Review>>("/reviews/", { params: { product: productId } }),

  create: (product: string, rating: number, comment?: string) =>
    axiosInstance.post<Review>("/reviews/", { product, rating, comment }),

  update: (id: string, data: { rating?: number; comment?: string }) =>
    axiosInstance.patch<Review>(`/reviews/${id}/`, data),

  delete: (id: string) => axiosInstance.delete(`/reviews/${id}/`),
};
