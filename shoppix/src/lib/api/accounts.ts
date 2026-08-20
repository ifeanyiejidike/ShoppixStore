import { axiosInstance } from "@/lib/axios.config";
import type { Paginated, ShippingAddress, User } from "@/lib/types";

export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const accountsApi = {
  /** Must be called once before any unsafe request so Django sets the csrftoken cookie. */
  getCsrf: () => axiosInstance.get<{ csrfToken: string }>("/accounts/csrf/"),

  register: (data: RegisterPayload) =>
    axiosInstance.post<{ detail: string; user: User }>("/accounts/register/", data),

  verifyEmail: (uid: string, token: string) =>
    axiosInstance.post<{ detail: string }>("/accounts/verify-email/", { uid, token }),

  login: (data: LoginPayload) => axiosInstance.post<{ user: User }>("/accounts/login/", data),

  logout: () => axiosInstance.post<{ detail: string }>("/accounts/logout/"),

  me: () => axiosInstance.get<User>("/accounts/me/"),

  changePassword: (old_password: string, new_password: string) =>
    axiosInstance.post<{ detail: string }>("/accounts/change-password/", { old_password, new_password }),

  requestPasswordReset: (email: string) =>
    axiosInstance.post<{ detail: string }>("/accounts/password-reset/", { email }),

  confirmPasswordReset: (uid: string, token: string, new_password: string) =>
    axiosInstance.post<{ detail: string }>("/accounts/password-reset/confirm/", {
      uid,
      token,
      new_password,
    }),

  listAddresses: () => axiosInstance.get<Paginated<ShippingAddress>>("/accounts/addresses/"),

  createAddress: (
    data: Omit<ShippingAddress, "id" | "created_at" | "country" | "zip_code" | "is_default"> & {
      country?: string;
      zip_code?: string;
      is_default?: boolean;
    }
  ) => axiosInstance.post<ShippingAddress>("/accounts/addresses/", data),

  updateAddress: (id: string, data: Partial<ShippingAddress>) =>
    axiosInstance.patch<ShippingAddress>(`/accounts/addresses/${id}/`, data),

  deleteAddress: (id: string) => axiosInstance.delete(`/accounts/addresses/${id}/`),
};
