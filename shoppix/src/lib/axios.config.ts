import axios from "axios";

/**
 * Backend base URL. NEXT_PUBLIC_API_URL should NOT include /api — this
 * appends it once here so every call site just does axiosInstance.get("/accounts/me/").
 */
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const baseUrl = `${backendUrl}/api`;

export const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true, // send/receive the Django sessionid + csrftoken cookies
  headers: {
    "Content-Type": "application/json",
  },
});

const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

// Django's CSRF middleware requires the X-CSRFToken header on every unsafe
// request, read from the csrftoken cookie the backend sets. The frontend
// must call GET /accounts/csrf/ at least once (see AuthProvider) before the
// cookie exists.
axiosInstance.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase() ?? "";
  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}
