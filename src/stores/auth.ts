import { defineStore } from "pinia";
import { computed, ref, onScopeDispose } from "vue";
import axios from "axios";

import {
  api,
  ACCESS_TOKEN_KEY,
  type ApiResponse,
} from "../lib/api";

import {
  RoleCode,
  type PermissionCode,
} from "@/constants/authorization";

import type {
  CurrentUser,
  LoginPayload,
  LoginResponse,
  ChangePasswordPayload,
} from "@/types/auth";

// Preserve compatibility with components
// importing authentication types from this store.

export type {
  Role,
  CurrentUser,
  LoginPayload,
  LoginResponse,
  ChangePasswordPayload,
} from "@/types/auth";

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
    () => Boolean(
      token.value &&
      user.value &&
      user.value.is_active
    )
  );

  const mustChangePassword = computed(
    () =>
      passwordChangeRequired.value ||
      Boolean(user.value?.must_change_password)
  );

  const displayName = computed(
    () =>
      user.value?.name ||
      user.value?.username ||
      ""
  );

  const primaryRole = computed(
    () => user.value?.roles[0] ?? null
  );

  // ========================================
  // ROLE AUTHORIZATION
  // ========================================

  function hasRole(roleCode: string): boolean {
    if (
      !isAuthenticated.value ||
      !user.value
    ) {
      return false;
    }

    return user.value.roles.some(
      (role) => role.code === roleCode
    );
  }

  function hasAnyRole(
    roles: readonly string[]
  ): boolean {
    return roles.some(
      (role) => hasRole(role)
    );
  }

  const isAdmin = computed(
    () => hasRole(RoleCode.ADMIN)
  );

  const isAccounting = computed(
    () => hasRole(RoleCode.ACCOUNTING)
  );

  const isTreasurer = computed(
    () => hasRole(RoleCode.TREASURER)
  );

  const isPayrollEncoder = computed(
    () => hasRole(RoleCode.PAYROLL_ENCODER)
  );

  const isHospitalEncoder = computed(
    () => hasRole(RoleCode.HOSPITAL_ENCODER)
  );

  const isEncoder = computed(
    () =>
      hasAnyRole([
        RoleCode.PAYROLL_ENCODER,
        RoleCode.HOSPITAL_ENCODER,
      ])
  );

  // ========================================
  // PERMISSION AUTHORIZATION
  // ========================================

  function can(permission: string): boolean {
    if (
      !isAuthenticated.value ||
      !user.value ||
      mustChangePassword.value
    ) {
      return false;
    }

    return user.value.permissions.includes(
      permission as PermissionCode
    );
  }

  function canAny(
    permissions: readonly string[]
  ): boolean {
    return permissions.some(
      (permission) => can(permission)
    );
  }

  function canAll(
    permissions: readonly string[]
  ): boolean {
    return (
      permissions.length > 0 &&
      permissions.every(
        (permission) => can(permission)
      )
    );
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  function setToken(response: LoginResponse) {
    if (!response?.access_token) {
      throw new Error(
        "Invalid authentication response."
      );
    }

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

  async function fetchMe(): Promise<CurrentUser | null> {
    if (!token.value) {
      return null;
    }

    const requestToken = token.value;

    try {
      const response = await api.get<
        ApiResponse<CurrentUser>
      >("/auth/me");

      if (token.value !== requestToken) {
        return null;
      }

      const currentUser = response.data.data;

      if (
        !response.data.success ||
        !currentUser ||
        !currentUser.is_active
      ) {
        clearSession();

        return null;
      }

      user.value = currentUser;

      passwordChangeRequired.value =
        currentUser.must_change_password;

      if (mustChangePassword.value) {
        user.value.permissions = [];
      }

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
  ): Promise<CurrentUser> {
    if (loading.value) {
      throw new Error(
        "An authentication request is already in progress."
      );
    }

    loading.value = true;

    clearSession();

    try {
      const payload: LoginPayload = {
        username,
        password,
      };

      const response = await api.post<
        ApiResponse<LoginResponse>
      >("/auth/login", payload);

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
          "Unable to sign in."
        );
      }

      setToken(response.data.data);

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
  // REFRESH PERMISSIONS
  // ========================================

  async function fetchPermissions(): Promise<PermissionCode[]> {
    if (
      !isAuthenticated.value ||
      !user.value ||
      mustChangePassword.value
    ) {
      return [];
    }

    const requestToken = token.value;

    const response = await api.get<
      ApiResponse<PermissionCode[]>
    >("/auth/permissions");

    if (
      token.value !== requestToken ||
      !user.value ||
      mustChangePassword.value
    ) {
      return [];
    }

    if (
      !response.data.success ||
      !Array.isArray(response.data.data)
    ) {
      user.value.permissions = [];

      throw new Error(
        "Unable to retrieve account permissions."
      );
    }

    user.value.permissions = response.data.data;

    return user.value.permissions;
  }

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  async function changePassword(
    payload: ChangePasswordPayload
  ): Promise<CurrentUser> {
    if (loading.value) {
      throw new Error(
        "An authentication request is already in progress."
      );
    }

    if (!token.value) {
      throw new Error(
        "Please sign in before changing your password."
      );
    }

    loading.value = true;

    const requestToken = token.value;

    try {
      const response = await api.post<
        ApiResponse<LoginResponse>
      >("/auth/change-password", payload);

      if (token.value !== requestToken) {
        throw new Error(
          "Your session has changed. Please sign in again."
        );
      }

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
          "Unable to change your password."
        );
      }

      // Laravel has revoked all previous
      // Sanctum access tokens.

      user.value = null;

      try {
        setToken(response.data.data);

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
        const response = await api.post<
          ApiResponse<null>
        >("/auth/logout");

        revoked = response.data.success;
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

  onScopeDispose(() => {
    window.removeEventListener(
      "jocos:session-expired",
      clearSession
    );

    window.removeEventListener(
      "jocos:password-change-required",
      requirePasswordChange
    );
  });

  // ========================================
  // EXPORTED STORE
  // ========================================

  return {
    // State
    token,
    user,
    loading,

    // Authentication
    isAuthenticated,
    mustChangePassword,

    // User information
    displayName,
    primaryRole,

    // Role indicators
    isAdmin,
    isAccounting,
    isTreasurer,
    isPayrollEncoder,
    isHospitalEncoder,
    isEncoder,

    // Authorization
    hasRole,
    hasAnyRole,
    can,
    canAny,
    canAll,

    // Authentication actions
    login,
    logout,
    fetchMe,
    fetchPermissions,
    clearSession,
    changePassword,
    requirePasswordChange,
  };
});