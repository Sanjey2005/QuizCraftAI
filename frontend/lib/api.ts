import axios from "axios";
import { getAccessToken, getRefreshToken, storeTokens, clearUser } from "./hooks";

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

// Inject access token as Authorization header on every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token — clear auth state and let the error propagate
        clearUser();
        return Promise.reject(error);
      }

      refreshPromise ??= axios
        .post("/api/auth/token/refresh", { refresh: refreshToken })
        .then((res) => {
          const { access, refresh } = res.data;
          storeTokens(access, refresh ?? refreshToken);
          return access;
        })
        .catch((err) => {
          clearUser();
          throw err;
        })
        .finally(() => {
          refreshPromise = null;
        });

      try {
        const newAccess = await refreshPromise;
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
