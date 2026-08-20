import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** DRF returns decimal fields as strings (e.g. "15000.00") — this formats
 * either that or a plain number into Naira currency for display. */
export function formatPriceToNaira(price: string | number) {
  const value = typeof price === "string" ? parseFloat(price) : price;
  return value.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

/** Extracts a human-readable message from a DRF error response, whatever
 * shape it comes in — {detail}, {field: [msgs]}, or a plain string. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const data = axiosError?.response?.data;
  if (!data) return fallback;

  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.join(" ");

  for (const key of Object.keys(data)) {
    if (key === "status_code") continue;
    const value = data[key];
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0] as string;
  }

  return fallback;
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}
