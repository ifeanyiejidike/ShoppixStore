import { axiosInstance } from "@/lib/axios.config";
import type { Paginated, Vendor } from "@/lib/types";

export interface VendorApplicationPayload {
  email: string;
  brand_name: string;
  description?: string;
}

export const vendorsApi = {
  apply: (data: VendorApplicationPayload) => axiosInstance.post<Vendor>("/vendors/apply/", data),

  me: () => axiosInstance.get<Vendor>("/vendors/me/"),

  updateMe: (data: Partial<Pick<Vendor, "description" | "email">>) =>
    axiosInstance.patch<Vendor>("/vendors/me/", data),

  list: (params?: { is_diamond?: boolean; search?: string; page?: number }) =>
    axiosInstance.get<Paginated<Vendor>>("/vendors/", { params }),

  getBySlug: (slug: string) => axiosInstance.get<Vendor>(`/vendors/${slug}/`),

  // --- Admin only ---
  adminList: () => axiosInstance.get<Paginated<Vendor>>("/vendors/admin/vendors/"),
  adminApprove: (id: string) => axiosInstance.post<Vendor>(`/vendors/admin/vendors/${id}/approve/`),
  adminSuspend: (id: string) => axiosInstance.post<Vendor>(`/vendors/admin/vendors/${id}/suspend/`),
};
