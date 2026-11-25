import {
  createRouter,
  createWebHistory,
} from "vue-router";

import { useAuthStore } from "../stores/auth";

import LandingView from "../views/LandingView.vue";
import LoginView from "../views/LoginView.vue";
import ChangePasswordView from "../views/ChangePasswordView.vue";

import DashboardView from "../views/DashboardView.vue";
import UsersView from "../views/UsersView.vue";
import DashboardLayout from "../layouts/DashboardLayout.vue";

import EmployeesView from "../views/EmployeesView.vue";
import DepartmentsView from "../views/DepartmentsView.vue";
import PositionsView from "../views/PositionsView.vue";
import OrganizationalUnitsView from "../views/OrganizationalUnitsView.vue";
import EmploymentContractsView from "../views/EmploymentContractsView.vue";

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
    // PROTECTED DASHBOARD
    // ======================================

    {
      path: "/dashboard",
      component: DashboardLayout,

      meta: {
        requiresAuth: true,
      },

      children: [
        {
          path: "",
          name: "dashboard",
          component: DashboardView,
        },

        {
          path: "users",
          name: "admin-users",
          component: UsersView,

          meta: {
            permission: "users.manage",
          },
        },

        {
          path: "employees",
          name: "employees",
          component: EmployeesView,

          meta: {
            permission: "employees.view",
          },
        },

        {
          path: "departments",
          name: "departments",
          component: DepartmentsView,

          meta: {
            permission: "departments.view",
          },
        },

        {
          path: "positions",
          name: "positions",
          component: PositionsView,

          meta: {
            permission: "positions.view",
          },
        },

        {
          path: "organizational-units",
          name: "organizational-units",
          component: OrganizationalUnitsView,

          meta: {
            permission: "users.manage",
          },
        },

        {
          path: "employment-contracts",
          name: "employment-contracts",
          component: EmploymentContractsView,

          meta: {
            permission: "contracts.view",
          },
        },
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

  if (auth.token && !auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      if (to.name === "login") {
        return true;
      }

      return { name: "login" };
    }
  }

  // Authentication is required.

  if (
    to.meta.requiresAuth &&
    !auth.isAuthenticated
  ) {
    return { name: "login" };
  }

  // Mandatory password change takes priority
  // over every other authenticated route.

  if (
    auth.isAuthenticated &&
    auth.mustChangePassword &&
    to.name !== "change-password"
  ) {
    return {
      name: "change-password",
    };
  }

  // Redirect authenticated users from login.

  if (
    auth.isAuthenticated &&
    to.name === "login"
  ) {
    return {
      name: "dashboard",
    };
  }

  // ========================================
  // ROLE AND PERMISSION VALIDATION
  // ========================================

  if (to.meta.requiresAuth) {
    const requiredPermission =
      to.meta.permission as string | undefined;

    if (
      requiredPermission &&
      !auth.can(requiredPermission)
    ) {
      return {
        name: "dashboard",
      };
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
    if (router.currentRoute.value.name !== "login") {
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