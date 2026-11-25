import axios from "axios";

export const ACCESS_TOKEN_KEY = "jocos_access_token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(
    ACCESS_TOKEN_KEY
  );

  if (token && config.url !== "/auth/login") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const requestUrl = error.config?.url;

    const requestToken =
      error.config?.headers?.Authorization;

    const currentToken = sessionStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    const isCurrentSession =
      currentToken &&
      requestToken === `Bearer ${currentToken}`;

    // Invalid or expired authentication session.

    if (
      status === 401 &&
      requestUrl !== "/auth/login" &&
      isCurrentSession
    ) {
      sessionStorage.removeItem(
        ACCESS_TOKEN_KEY
      );

      window.dispatchEvent(
        new Event("jocos:session-expired")
      );
    }

    // Mandatory password change required.

    if (
      status === 403 &&
      detail?.code === "PASSWORD_CHANGE_REQUIRED" &&
      isCurrentSession
    ) {
      window.dispatchEvent(
        new Event("jocos:password-change-required")
      );
    }

    return Promise.reject(error);
  }
);