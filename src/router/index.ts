import {
  createRouter,
  createWebHistory,
} from "vue-router";

import { useAuthStore } from "../stores/auth";

import {
  RoleCode,
  PermissionCode,
} from "@/constants/authorization";

import LandingView from "../views/LandingView.vue";
import LoginView from "../views/LoginView.vue";
import ChangePasswordView from "../views/ChangePasswordView.vue";

import DashboardView from "../views/DashboardView.vue";
import DashboardLayout from "../layouts/DashboardLayout.vue";

import UsersView from "../views/UsersView.vue";
import EmployeesView from "../views/EmployeesView.vue";
import DepartmentsView from "../views/DepartmentsView.vue";
import PositionsView from "../views/PositionsView.vue";
import OrganizationalUnitsView from "../views/OrganizationalUnitsView.vue";

const router = createRouter({
  history: createWebHistory(),

  routes: [
    // ======================================
    // PUBLIC ROUTES
    // ======================================

    {
      path: "/",
      name: "home",
      component: LandingView,
    },

    {
      path: "/login",
      name: "login",
      component: LoginView,

      meta: {
        guestOnly: true,
      },
    },

    // Public registration is disabled.

    {
      path: "/register",
      name: "register",
      redirect: "/login",
    },

    // ======================================
    // PASSWORD SECURITY
    // ======================================

    {
      path: "/change-password",
      name: "change-password",
      component: ChangePasswordView,

      meta: {
        requiresAuth: true,
        allowPasswordChange: true,
      },
    },

    // ======================================
    // ACCESS DENIED
    // ======================================

    {
      path: "/forbidden",
      name: "forbidden",

      component: () =>
        import("../views/ForbiddenView.vue"),

      meta: {
        requiresAuth: true,
      },
    },

    // ======================================
    // PROTECTED DASHBOARD
    // ======================================

    {
      path: "/dashboard",
      component: DashboardLayout,

      meta: {
        requiresAuth: true,
      },

      children: [
        // ==================================
        // DASHBOARD OVERVIEW
        // ==================================

        {
          path: "",
          name: "dashboard",
          component: DashboardView,
        },

        // ==================================
        // SYSTEM ADMINISTRATION
        // ==================================

        {
          path: "users",
          name: "admin-users",
          component: UsersView,

          meta: {
            roles: [
              RoleCode.ADMIN,
            ],

            permissions: [
              PermissionCode.USERS_VIEW,
            ],
          },
        },

        {
          path: "organizational-units",
          name: "organizational-units",
          component: OrganizationalUnitsView,

          meta: {
            roles: [
              RoleCode.ADMIN,
            ],

            permissions: [
              PermissionCode.ORGANIZATIONAL_UNITS_VIEW,
            ],
          },
        },

        // ==================================
        // APPROVED EMPLOYEE REGISTRY
        // ==================================

        {
          path: "employees",
          name: "employees",
          component: EmployeesView,

          meta: {
            permissions: [
              PermissionCode.EMPLOYEES_VIEW,
            ],
          },
        },

        // ==================================
        // HRIS REFERENCE DATA
        // ==================================

        {
          path: "departments",
          name: "departments",
          component: DepartmentsView,

          meta: {
            permissions: [
              PermissionCode.DEPARTMENTS_VIEW,
            ],
          },
        },

        {
          path: "positions",
          name: "positions",
          component: PositionsView,

          meta: {
            permissions: [
              PermissionCode.POSITIONS_VIEW,
            ],
          },
        },

        // ==================================
        // FUTURE MODULES
        // ==================================

        // Department Access Mappings
        // HRIS Employee Records
        // HRIS Appointment Records
        // HRIS Synchronization Requests
        // Appointment Approvals
        // Payroll Preparation
        // Payroll Review
        // Treasury Exports
      ],
    },

    // ======================================
    // FALLBACK
    // ======================================

    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

// ==========================================
// GLOBAL NAVIGATION GUARD
// ==========================================

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // ========================================
  // RESTORE AUTHENTICATED SESSION
  // ========================================

  if (auth.token && !auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      if (to.meta.requiresAuth) {
        return {
          name: "login",
        };
      }

      return true;
    }
  }

  // ========================================
  // AUTHENTICATION VALIDATION
  // ========================================

  if (
    to.meta.requiresAuth &&
    !auth.isAuthenticated
  ) {
    return {
      name: "login",
    };
  }

  // ========================================
  // MANDATORY PASSWORD CHANGE
  // ========================================

  if (
    auth.isAuthenticated &&
    auth.mustChangePassword &&
    !to.meta.allowPasswordChange
  ) {
    return {
      name: "change-password",
    };
  }

  // ========================================
  // GUEST-ONLY ROUTES
  // ========================================

  if (
    auth.isAuthenticated &&
    to.meta.guestOnly
  ) {
    return {
      name: "dashboard",
    };
  }

  // ========================================
  // ROLE AND PERMISSION VALIDATION
  // ========================================

  if (to.meta.requiresAuth) {
    for (const record of to.matched) {
      const requiredRoles =
        record.meta.roles;

      if (
        requiredRoles?.length &&
        !auth.hasAnyRole(requiredRoles)
      ) {
        return {
          name: "forbidden",
        };
      }

      const requiredPermissions =
        record.meta.permissions;

      if (
        requiredPermissions?.length &&
        !auth.canAll(requiredPermissions)
      ) {
        return {
          name: "forbidden",
        };
      }
    }
  }

  return true;
});

// ==========================================
// GLOBAL SESSION EVENTS
// ==========================================

window.addEventListener(
  "jocos:session-expired",
  () => {
    if (
      router.currentRoute.value.name !==
      "login"
    ) {
      void router.replace({
        name: "login",
      });
    }
  }
);

window.addEventListener(
  "jocos:password-change-required",
  () => {
    if (
      router.currentRoute.value.name !==
      "change-password"
    ) {
      void router.replace({
        name: "change-password",
      });
    }
  }
);

export default router;