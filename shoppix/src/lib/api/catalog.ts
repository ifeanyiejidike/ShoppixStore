import { axiosInstance } from "@/lib/axios.config";
import type { Category, Paginated, Product, ProductListItem } from "@/lib/types";

export interface ProductFilters {
  category?: string;
  vendor?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  flash_sale?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
}

export interface ProductWritePayload {
  name: string;
  description?: string;
  stock: number;
  current_price: string;
  old_price?: string | null;
  category_id?: string | null;
  is_active?: boolean;
  is_on_flash_sales?: boolean;
  flash_sale_ends_at?: string | null;
}

export const catalogApi = {
  listCategories: () => axiosInstance.get<Paginated<Category>>("/catalog/categories/"),
  getCategory: (slug: string) => axiosInstance.get<Category>(`/catalog/categories/${slug}/`),

  listProducts: (filters?: ProductFilters) =>
    axiosInstance.get<Paginated<ProductListItem>>("/catalog/products/", { params: filters }),

  getProduct: (slug: string) => axiosInstance.get<Product>(`/catalog/products/${slug}/`),

  // --- Vendor-managed (requires an activated vendor session) ---
  myProducts: (filters?: ProductFilters) =>
    axiosInstance.get<Paginated<Product>>("/catalog/products/mine/", { params: filters }),

  createProduct: (data: ProductWritePayload) => axiosInstance.post<Product>("/catalog/products/", data),

  updateProduct: (slug: string, data: Partial<ProductWritePayload>) =>
    axiosInstance.patch<Product>(`/catalog/products/${slug}/`, data),

  deleteProduct: (slug: string) => axiosInstance.delete(`/catalog/products/${slug}/`),
};
