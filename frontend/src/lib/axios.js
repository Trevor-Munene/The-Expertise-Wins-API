// frontend/src/lib/axios.js
import axios from "axios";
import { auth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

function getUsageClientId() {
  if (typeof window === "undefined") return null;

  const storageKey = "tew_usage_client_id";
  let clientId = window.localStorage.getItem(storageKey);
  if (!clientId) {
    clientId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(storageKey, clientId);
  }
  return clientId;
}

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const usageClientId = getUsageClientId();
  if (usageClientId) config.headers["X-TEW-Client-Id"] = usageClientId;
  return config;
});

// On 401 clear local auth state
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      auth.clear();
      if (
        typeof window !== "undefined" &&
        (window.location.pathname.startsWith("/admin") ||
          window.location.pathname.startsWith("/profile"))
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
