<script setup lang="ts">

import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import {
  Bell,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
  Building2,
  BriefcaseBusiness,
  Network,
  FileSignature 
} from "lucide-vue-next";

import {
  RouterView,
  RouterLink,
  useRouter,
  useRoute,
} from "vue-router";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);
const profileOpen = ref(false);

const user = computed(() => auth.user);

const username = computed(
  () => user.value?.username || "Administrator"
);

const roleNames = computed(() =>
  (user.value?.roles || []).map((role: any) =>
    typeof role === "string" ? role : role.name
  )
);

const permissions = computed<string[]>(() =>
  (user.value?.permissions || []).map((permission: any) =>
    typeof permission === "string"
      ? permission
      : permission.code
  )
);

const isAdmin = computed(() =>
  (user.value?.roles || []).some((role: any) => {
    const code =
      typeof role === "string"
        ? role
        : role.code;

    return String(code).toUpperCase() === "ADMIN";
  })
);

function can(permission: string) {
  return permissions.value.includes(permission);
}


const navigation = computed(() => [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        route: "/dashboard",
        enabled: true,
        upcoming: false,
      },
    ],
  },
  {
  title: "Personnel",
  items: [
    {
      label: "Employee Management",
      icon: Users,
      route: "/dashboard/employees",
      enabled:
        can("employees.view") &&
        ![
          "PAYROLL_ENCODER",
          "HOSPITAL_ENCODER",
          "EMPLOYEE",
        ].some((code) =>
          (user.value?.roles || []).some(
            (role: any) =>
              (
                typeof role === "string"
                  ? role
                  : role.code
              ) === code
          )
        ),
      upcoming: false,
    },
    {
      label: "Employment Contracts",
      icon: FileSignature,
      route: "/dashboard/employment-contracts",
      enabled: can("contracts.view"),
      upcoming: false,
    },
  ],
},
 {
  title: "Master Data",
  items: [
    {
      label: "Organizational Units",
      icon: Network,
      route: "/dashboard/organizational-units",
      enabled: can("users.manage"),
      upcoming: false,
    },
    {
      label: "Departments",
      icon: Building2,
      route: "/dashboard/departments",
      enabled: can("departments.view"),
      upcoming: false,
    },
    {
      label: "Positions",
      icon: BriefcaseBusiness,
      route: "/dashboard/positions",
      enabled: can("positions.view"),
      upcoming: false,
    },
  ],
},  
  {
    title: "Payroll Operations",
    items: [
      {
        label: "Payroll Processing",
        icon: Calculator,
        route: "/payroll",
        enabled: can("payroll.view"),
        upcoming: true,
      },
      {
        label: "Payroll Review",
        icon: ClipboardCheck,
        route: "/payroll/review",
        enabled: can("payroll.review"),
        upcoming: true,
      },
      {
        label: "Special Compensation",
        icon: Wallet,
        route: "/compensation",
        enabled: can("payroll.view"),
        upcoming: true,
      },
      {
        label: "Reports & Printing",
        icon: FileText,
        route: "/reports",
        enabled: can("payroll.view"),
        upcoming: true,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users & Access",
        icon: ShieldCheck,
        route: "/dashboard/users",
        enabled: can("users.manage"),
        upcoming: false,
      },
      {
        label: "System Settings",
        icon: Settings,
        route: "/admin/settings",
        enabled: false,
        upcoming: true,
      },
    ],
  },
]);

const visibleNavigation = computed(() =>
  navigation.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.enabled),
    }))
    .filter((group) => group.items.length > 0)
);


const breadcrumbTitle = computed(() => {
  const currentItem = visibleNavigation.value
    .flatMap((group) => group.items)
    .find((item) => item.route === route.path);

  return currentItem?.label || "Dashboard";
});


const currentDate = computed(() =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
);

function handleLogout() {
  profileOpen.value = false;
  mobileSidebarOpen.value = false;
  auth.logout();
  router.replace("/login");
}

function closeSidebar() {
  mobileSidebarOpen.value = false;
}

onMounted(async () => {
  if (!auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      await router.replace("/login");
    }
  }
});
</script>
<template>

  <div class="dashboard-shell">
    <!-- MOBILE OVERLAY -->
    <div
      v-if="mobileSidebarOpen"
      class="mobile-overlay"
      @click="closeSidebar"
    ></div>

    <!-- SIDEBAR -->
    <aside
      class="sidebar"
      :class="{
        collapsed: sidebarCollapsed,
        'mobile-open': mobileSidebarOpen,
      }"
    >
      <div class="sidebar-header">
        <RouterLink
          to="/dashboard"
          class="sidebar-brand"
          @click="closeSidebar"
        >
          <img
            src="/images/logo.png"
            alt="Provincial seal"
            class="sidebar-logo"
          />

          <div v-if="!sidebarCollapsed" class="sidebar-brand-text">
            <strong>JOCOS Payroll</strong>
            <span>Management System 2.0</span>
          </div>
        </RouterLink>

        <button
          class="mobile-close"
          type="button"
          aria-label="Close navigation"
          @click="closeSidebar"
        >
          <X :size="21" />
        </button>
      </div>

      <div v-if="!sidebarCollapsed" class="sidebar-workspace">
        <span class="workspace-indicator"></span>
        Provincial Payroll Workspace
      </div>

      <nav class="sidebar-navigation" aria-label="Dashboard navigation">
        <div
          v-for="group in visibleNavigation"
          :key="group.title"
          class="nav-group"
        >
          <div v-if="!sidebarCollapsed" class="nav-group-label">
            {{ group.title }}
          </div>

          <div v-else class="nav-group-divider"></div>

          <template
            v-for="item in group.items"
            :key="item.route"
          >
            <RouterLink
              v-if="!item.upcoming"
              :to="item.route"
              class="nav-item"
              :class="{ active: $route.path === item.route }"
              :title="sidebarCollapsed ? item.label : undefined"
              @click="closeSidebar"
            >
              <component :is="item.icon" :size="19" />

              <span v-if="!sidebarCollapsed" class="nav-item-label">
                {{ item.label }}
              </span>
            </RouterLink>

            <div
              v-else
              class="nav-item upcoming"
              :title="`${item.label} — Coming soon`"
            >
              <component :is="item.icon" :size="19" />

              <span v-if="!sidebarCollapsed" class="nav-item-label">
                {{ item.label }}
              </span>

              <span v-if="!sidebarCollapsed" class="nav-soon">
                Soon
              </span>
            </div>
          </template>
        </div>
      </nav>

      <div class="sidebar-bottom">
        <div v-if="!sidebarCollapsed" class="sidebar-security">
          <ShieldCheck :size="18" />
          <div>
            <strong>Secure Workspace</strong>
            <span>Role-based access enabled</span>
          </div>
        </div>

        <button
          type="button"
          class="collapse-button"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <ChevronRight v-if="sidebarCollapsed" :size="18" />
          <ChevronLeft v-else :size="18" />

          <span v-if="!sidebarCollapsed">
            Collapse sidebar
          </span>
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <div
      class="main-area"
      :class="{ expanded: sidebarCollapsed }"
    >
      <!-- TOPBAR -->
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="menu-toggle"
            type="button"
            aria-label="Open navigation"
            @click="mobileSidebarOpen = true"
          >
            <Menu :size="22" />
          </button>

         
<div class="breadcrumb">
  <span>Workspace</span>
  <ChevronRight :size="15" />
  <strong>{{ breadcrumbTitle }}</strong>
</div>

        </div>

        <div class="topbar-right">
          <div class="topbar-date">
            {{ currentDate }}
          </div>

          <span class="topbar-divider"></span>

          <button
            type="button"
            class="notification-button"
            title="Notifications are not available yet"
            aria-label="Notifications unavailable"
            disabled
          >
            <Bell :size="20" />
          </button>

          <div class="profile-container">
            <button
              class="profile-trigger"
              type="button"
              :aria-expanded="profileOpen"
              @click="profileOpen = !profileOpen"
            >
              <div class="profile-avatar">
                {{ username.charAt(0).toUpperCase() }}
              </div>

              <div class="profile-details">
                <strong>{{ username }}</strong>
                <span>{{ roleNames.join(", ") || "User" }}</span>
              </div>

              <ChevronDown :size="16" />
            </button>

            <div v-if="profileOpen" class="profile-menu">
              <div class="profile-menu-header">
                <strong>{{ username }}</strong>
                <span>{{ user?.email || "No email assigned" }}</span>
              </div>

              <button
                type="button"
                class="logout-option"
                @click="handleLogout"
              >
                <LogOut :size="17" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <RouterView />
    </div>
  </div>
</template>
<style scoped>

.dashboard-shell {
  --sidebar-width: 268px;
  --sidebar-collapsed: 78px;
  --deep: #062f29;
  --green: #087452;
  --ink: #193029;
  --muted: #7b8b82;
  --border: #e5ebe7;

  min-height: 100vh;
  background: #f5f7f6;
  color: var(--ink);
}

/* SIDEBAR */

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: #062f29;
  color: white;
  transition: width 0.25s ease;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}

.sidebar-header {
  min-height: 91px;
  display: flex;
  align-items: center;
  padding: 20px 19px;
  border-bottom: 1px solid #ffffff13;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: white;
  text-decoration: none;
}

.sidebar-logo {
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  object-fit: contain;
}

.sidebar-brand-text {
  min-width: 0;
}

.sidebar-brand-text strong,
.sidebar-brand-text span {
  display: block;
}

.sidebar-brand-text strong {
  font-size: 15px;
  white-space: nowrap;
}

.sidebar-brand-text span {
  margin-top: 5px;
  color: #9bc3b0;
  font-size: 10px;
  white-space: nowrap;
}

.sidebar-workspace {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 22px 18px 8px;
  padding: 12px;
  border: 1px solid #ffffff19;
  border-radius: 9px;
  background: #ffffff0a;
  color: #c2dbce;
  font-size: 11px;
  white-space: nowrap;
}

.workspace-indicator {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #58d998;
}

.sidebar-navigation {
  flex: 1;
  overflow-y: auto;
  padding: 17px 11px 20px;
  scrollbar-width: thin;
  scrollbar-color: #ffffff24 transparent;
}

.nav-group {
  margin-bottom: 24px;
}

.nav-group-label {
  padding: 0 13px;
  margin-bottom: 11px;
  color: #7eaa95;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.nav-group-divider {
  height: 1px;
  margin: 0 10px 14px;
  background: #ffffff19;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 43px;
  padding: 11px 13px;
  border-radius: 9px;
  color: #bad1c4;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background: #ffffff0d;
  color: white;
}

.nav-item.active {
  background: #11845b;
  color: white;
}

.nav-item.upcoming {
  cursor: not-allowed;
  opacity: 0.67;
}

.nav-item-label {
  flex: 1;
  white-space: nowrap;
}

.nav-soon {
  font-size: 9px;
  font-weight: 700;
  color: #9ec8b1;
}

.sidebar-bottom {
  padding: 13px 11px 16px;
  border-top: 1px solid #ffffff14;
}

.sidebar-security {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 11px 18px;
  color: #8ee1ad;
}

.sidebar-security strong,
.sidebar-security span {
  display: block;
}

.sidebar-security strong {
  color: white;
  font-size: 11px;
}

.sidebar-security span {
  margin-top: 4px;
  color: #95bba6;
  font-size: 10px;
}

.collapse-button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 13px;
  border: 0;
  border-radius: 8px;
  background: #ffffff0a;
  color: #b8d4c5;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.collapse-button:hover {
  background: #ffffff15;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 18px 10px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed .collapse-button {
  justify-content: center;
}

.mobile-close,
.mobile-overlay {
  display: none;
}

/* MAIN LAYOUT */

.main-area {
  margin-left: var(--sidebar-width);
  min-width: 0;
  transition: margin-left 0.25s ease;
}

.main-area.expanded {
  margin-left: var(--sidebar-collapsed);
}

/* TOPBAR */

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 34px;
  border-bottom: 1px solid var(--border);
  background: #ffffffed;
  backdrop-filter: blur(15px);
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 19px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9aaba1;
  font-size: 12px;
}

.breadcrumb strong {
  color: #264438;
  font-weight: 700;
}

.topbar-date {
  color: #7c8c83;
  font-size: 12px;
}

.topbar-divider {
  width: 1px;
  height: 26px;
  background: #e5ece7;
}

.notification-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: #7b9184;
  opacity: 0.6;
}

.profile-container {
  position: relative;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: #718078;
  cursor: pointer;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #e1f3e8;
  color: #087452;
  font-size: 14px;
  font-weight: 800;
}

.profile-details {
  text-align: left;
}

.profile-details strong,
.profile-details span {
  display: block;
}

.profile-details strong {
  color: #1d382b;
  font-size: 12px;
}

.profile-details span {
  margin-top: 3px;
  color: #8b9c92;
  font-size: 10px;
}

.profile-menu {
  position: absolute;
  top: calc(100% + 17px);
  right: 0;
  width: 245px;
  padding: 8px;
  border: 1px solid #e5ece7;
  border-radius: 12px;
  background: white;
  box-shadow: 0 15px 40px #0c2b1c17;
}

.profile-menu-header {
  padding: 13px;
  border-bottom: 1px solid #edf1ee;
}

.profile-menu-header strong,
.profile-menu-header span {
  display: block;
}

.profile-menu-header strong {
  font-size: 13px;
}

.profile-menu-header span {
  margin-top: 5px;
  color: #87978c;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.logout-option {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #b33c3c;
  text-align: left;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.logout-option:hover {
  background: #fff0f0;
}

.menu-toggle {
  display: none;
  border: 0;
  background: transparent;
  color: #234437;
  cursor: pointer;
}

/* CONTENT */

.dashboard-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 35px 34px 24px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 27px;
}

.page-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #087452;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.eyebrow-line {
  width: 22px;
  height: 2px;
  background: #087452;
}

.page-heading h1 {
  margin: 13px 0 7px;
  font-size: clamp(25px, 2.4vw, 34px);
  letter-spacing: -1px;
  font-weight: 770;
}

.page-heading p {
  margin: 0;
  color: #829087;
  font-size: 13px;
}

.page-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid #d9ebdf;
  border-radius: 100px;
  background: #eff8f1;
  color: #25824d;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #35ad65;
}

/* WELCOME BANNER */

.welcome-banner {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 225px;
  display: flex;
  align-items: center;
  padding: 35px 38px;
  border-radius: 16px;
  color: white;
  background:
    linear-gradient(
      90deg,
      rgba(3, 47, 39, 0.96),
      rgba(5, 81, 58, 0.87)
    ),
    url("/images/capitol.jpg") center / cover no-repeat;
}

.welcome-banner-content {
  position: relative;
  z-index: 2;
  max-width: 650px;
}

.banner-label {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #a5ebbc;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.welcome-banner h2 {
  margin: 15px 0 12px;
  font-size: clamp(23px, 2.4vw, 34px);
  line-height: 1.18;
  letter-spacing: -1px;
}

.welcome-banner h2 span {
  display: block;
  color: #a7efbf;
}

.welcome-banner p {
  margin: 0;
  color: #c7dfd2;
  font-size: 13px;
  line-height: 1.8;
}

.banner-role {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 19px;
  color: #a7efbf;
  font-size: 11px;
  font-weight: 650;
}

.banner-decoration {
  position: absolute;
  right: -110px;
  top: -170px;
  width: 470px;
  height: 470px;
  border: 1px solid #ffffff20;
  border-radius: 50%;
}

/* SECTIONS */

.overview-section,
.modules-section,
.access-details-section {
  margin-top: 37px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 19px;
}

.section-heading h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.4px;
}

.section-heading p {
  margin: 6px 0 0;
  color: #88978d;
  font-size: 12px;
}

.section-meta {
  color: #7c9c8b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.overview-card {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 23px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: white;
}

.overview-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 11px;
}

.overview-icon.green {
  color: #07845b;
  background: #e5f5eb;
}

.overview-icon.blue {
  color: #3269b1;
  background: #edf3fc;
}

.overview-icon.amber {
  color: #b47b20;
  background: #fff5df;
}

.overview-icon.purple {
  color: #8655ad;
  background: #f3ecfa;
}

.overview-card-body {
  min-width: 0;
}

.overview-card-body span,
.overview-card-body strong,
.overview-card-body small {
  display: block;
}

.overview-card-body span {
  color: #829188;
  font-size: 11px;
}

.overview-card-body strong {
  margin: 8px 0 6px;
  color: #1c372b;
  font-size: 24px;
  font-weight: 780;
  line-height: 1.1;
}

.overview-card-body small {
  color: #9ba99f;
  font-size: 10px;
  line-height: 1.6;
}

/* MODULE CARDS */

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.module-card {
  min-height: 225px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: white;
}

.module-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.module-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #087452;
  background: #e7f5ec;
}

.module-badge {
  padding: 6px 10px;
  border-radius: 100px;
  background: #f1f5f2;
  color: #7b8f82;
  font-size: 10px;
  font-weight: 750;
}

.module-card h3 {
  margin: 22px 0 9px;
  font-size: 15px;
}

.module-card p {
  margin: 0;
  color: #7c8b81;
  font-size: 12px;
  line-height: 1.8;
}

.module-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 20px;
  color: #8a9b8e;
  font-size: 11px;
}

.empty-modules {
  padding: 35px;
  border: 1px dashed #cbdcd0;
  border-radius: 13px;
  background: white;
  text-align: center;
  color: #81978a;
}

.empty-modules h3 {
  color: #203b2d;
  font-size: 15px;
}

.empty-modules p {
  font-size: 12px;
}

/* ACCOUNT DETAILS */

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 17px;
}

.details-card {
  padding: 25px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: white;
}

.details-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 20px;
  border-bottom: 1px solid #edf1ee;
  color: #1f4330;
  font-size: 14px;
  font-weight: 750;
}

.details-title svg {
  color: #087452;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f3f1;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-row span {
  color: #87968c;
  font-size: 12px;
}

.detail-row strong {
  color: #284334;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  overflow-wrap: anywhere;
}

.detail-row strong.status-active {
  color: #118653;
}

.access-subtitle {
  margin-top: 21px;
  color: #8a9b8f;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.1px;
}

.permission-title {
  margin-top: 25px;
}

.role-chips,
.permission-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 13px;
}

.role-chip {
  padding: 8px 11px;
  border: 1px solid #d3e8d9;
  border-radius: 7px;
  background: #edf8f0;
  color: #147a4d;
  font-size: 11px;
  font-weight: 700;
}

.permission-chip {
  padding: 7px 10px;
  border: 1px solid #e5ebe6;
  border-radius: 7px;
  background: #f6f8f6;
  color: #607669;
  font-size: 10px;
  font-weight: 650;
}

.empty-text {
  color: #9ba99f;
  font-size: 12px;
}

/* FOOTER */

.dashboard-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 40px;
  padding: 24px 0 10px;
  border-top: 1px solid #e0e8e2;
  color: #9aaa9f;
  font-size: 11px;
}

/* RESPONSIVE */

@media (max-width: 1300px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modules-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .sidebar {
    width: 268px;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: 268px;
  }

  .sidebar.collapsed .sidebar-brand-text,
  .sidebar.collapsed .nav-group-label,
  .sidebar.collapsed .nav-item-label,
  .sidebar.collapsed .nav-soon,
  .sidebar.collapsed .sidebar-security {
    display: initial;
  }

  .sidebar.collapsed .sidebar-brand-text {
    display: block;
  }

  .sidebar.collapsed .nav-item {
    justify-content: flex-start;
  }

  .sidebar.collapsed .collapse-button {
    display: none;
  }

  .mobile-close {
    display: grid;
    place-items: center;
    margin-left: auto;
    border: 0;
    background: transparent;
    color: white;
    cursor: pointer;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 90;
    background: #061c17a8;
  }

  .main-area,
  .main-area.expanded {
    margin-left: 0;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .topbar {
    padding: 0 22px;
  }

  .dashboard-content {
    padding: 27px 22px;
  }

  .topbar-date {
    display: none;
  }

  .topbar-divider {
    display: none;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .topbar {
    min-height: 67px;
    padding: 0 16px;
  }

  .topbar-left,
  .topbar-right {
    gap: 10px;
  }

  .profile-details,
  .profile-trigger > svg {
    display: none;
  }

  .dashboard-content {
    padding: 22px 16px;
  }

  .page-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-banner {
    padding: 27px;
    min-height: 240px;
  }

  .overview-grid,
  .modules-grid {
    grid-template-columns: 1fr;
  }

  .section-meta {
    display: none;
  }

  .dashboard-footer {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .main-area,
  .nav-item {
    transition: none;
  }
}
</style>
