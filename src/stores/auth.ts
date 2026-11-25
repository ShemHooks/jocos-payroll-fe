import { defineStore } from "pinia";
import { computed, ref } from "vue";
import axios from "axios";

import {
  api,
  ACCESS_TOKEN_KEY,
} from "../lib/api";

// ==========================================
// TYPES
// ==========================================

interface Role {
  id?: number;
  code: string;
  name: string;
}

interface CurrentUser {
  id: number;
  employee_id: number | null;
  username: string;
  email: string | null;
  is_active: boolean;
  must_change_password: boolean;
  roles: Role[];
  permissions: string[];
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  must_change_password: boolean;
}

interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ==========================================
// AUTHENTICATION STORE
// ==========================================

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );

  const user = ref<CurrentUser | null>(null);

  const loading = ref(false);

  const passwordChangeRequired = ref(false);

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  const isAuthenticated = computed(
    () => Boolean(token.value && user.value)
  );

  const mustChangePassword = computed(
    () =>
      passwordChangeRequired.value ||
      Boolean(user.value?.must_change_password)
  );

  const isAdmin = computed(
    () =>
      user.value?.roles.some(
        (role) => role.code === "ADMIN"
      ) ?? false
  );

  const isEmployee = computed(
    () =>
      user.value?.roles.some(
        (role) => role.code === "EMPLOYEE"
      ) ?? false
  );

  // ========================================
  // PERMISSIONS
  // ========================================

  function can(permission: string): boolean {
    if (
      !isAuthenticated.value ||
      mustChangePassword.value
    ) {
      return false;
    }

    return (
      user.value?.permissions.includes(permission) ??
      false
    );
  }

  function hasRole(roleCode: string): boolean {
    return (
      user.value?.roles.some(
        (role) => role.code === roleCode
      ) ?? false
    );
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  function setToken(response: LoginResponse) {
    token.value = response.access_token;

    passwordChangeRequired.value =
      response.must_change_password;

    sessionStorage.setItem(
      ACCESS_TOKEN_KEY,
      response.access_token
    );
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    passwordChangeRequired.value = false;

    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );
  }

  function requirePasswordChange() {
    passwordChangeRequired.value = true;

    if (user.value) {
      user.value.must_change_password = true;
      user.value.permissions = [];
    }
  }

  // ========================================
  // CURRENT USER
  // ========================================

  async function fetchMe() {
    if (!token.value) return null;

    const requestToken = token.value;

    try {
      const response =
        await api.get<CurrentUser>("/auth/me");

      if (token.value !== requestToken) {
        return null;
      }

      user.value = response.data;

      passwordChangeRequired.value =
        response.data.must_change_password;

      return user.value;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        if (token.value === requestToken) {
          clearSession();
        }

        return null;
      }

      throw error;
    }
  }

  // ========================================
  // LOGIN
  // ========================================

  async function login(
    username: string,
    password: string
  ) {
    loading.value = true;

    clearSession();

    try {
      const response =
        await api.post<LoginResponse>(
          "/auth/login",
          {
            username,
            password,
          }
        );

      setToken(response.data);

      const currentUser = await fetchMe();

      if (!currentUser) {
        throw new Error(
          "Unable to retrieve your account."
        );
      }

      return currentUser;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      loading.value = false;
    }
  }

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  async function changePassword(
    payload: ChangePasswordPayload
  ) {
    loading.value = true;

    const requestToken = token.value;

    try {
      const response =
        await api.post<LoginResponse>(
          "/auth/change-password",
          payload
        );

      if (token.value !== requestToken) {
        throw new Error(
          "Your session has changed. Please sign in again."
        );
      }

      // Replace the invalidated JWT.

      user.value = null;

      setToken(response.data);

      try {
        const currentUser = await fetchMe();

        if (!currentUser) {
          throw new Error(
            "Please sign in with your new password."
          );
        }

        return currentUser;
      } catch {
        clearSession();

        throw new Error(
          "Password changed. Please sign in with your new password."
        );
      }
    } finally {
      loading.value = false;
    }
  }

  // ========================================
  // SERVER-SIDE LOGOUT
  // ========================================

  async function logout(): Promise<boolean> {
    const requestToken = token.value;

    let revoked = true;

    try {
      if (requestToken) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      revoked =
        axios.isAxiosError(error) &&
        error.response?.status === 401;
    } finally {
      if (token.value === requestToken) {
        clearSession();
      }
    }

    return revoked;
  }

  // ========================================
  // GLOBAL AUTHENTICATION EVENTS
  // ========================================

  window.addEventListener(
    "jocos:session-expired",
    clearSession
  );

  window.addEventListener(
    "jocos:password-change-required",
    requirePasswordChange
  );

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isEmployee,
    mustChangePassword,
    can,
    hasRole,
    login,
    logout,
    fetchMe,
    clearSession,
    changePassword,
    requirePasswordChange,
  };
});