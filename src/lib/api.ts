import axios from "axios";

export const ACCESS_TOKEN_KEY = "jocos_access_token";

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string | string[]> | null;
}

// ==========================================
// AXIOS INSTANCE
// ==========================================

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(
    ACCESS_TOKEN_KEY
  );

  if (token && config.url !== "/auth/login") {
    config.headers.set(
      "Authorization",
      `Bearer ${token}`
    );
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

    const errors = error.response?.data?.errors;

    const requestUrl = error.config?.url;

    const requestToken =
      error.config?.headers?.Authorization;

    const currentToken = sessionStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    const isCurrentSession = Boolean(
      currentToken &&
      requestToken === `Bearer ${currentToken}`
    );

    // ======================================
    // INVALID OR EXPIRED SESSION
    // ======================================

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

    // ======================================
    // MANDATORY PASSWORD CHANGE
    // ======================================

    if (
      status === 403 &&
      errors?.code === "PASSWORD_CHANGE_REQUIRED" &&
      isCurrentSession
    ) {
      window.dispatchEvent(
        new Event("jocos:password-change-required")
      );
    }

    return Promise.reject(error);
  }
);

// ==========================================
// API ERROR MESSAGE HELPER
// ==========================================

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response?.data;

    if (error.response?.status === 429) {
      return "Too many attempts. Please try again later.";
    }

    if (response?.errors) {
      for (const [key, value] of Object.entries(
        response.errors
      )) {
        if (key === "code") continue;

        if (
          Array.isArray(value) &&
          typeof value[0] === "string"
        ) {
          return value[0];
        }

        if (typeof value === "string") {
          return value;
        }
      }
    }

    if (typeof response?.message === "string") {
      return response.message;
    }

    if (!error.response) {
      return "Unable to connect to the server. Please check your connection.";
    }

    return fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}