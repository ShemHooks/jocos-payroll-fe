<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { RoleCode } from "@/constants/authorization";
import { Activity, ArrowRight, Calculator, ClipboardCheck, FileText, Fingerprint, LockKeyhole, ShieldCheck, Users } from "lucide-vue-next";
const auth = useAuthStore();
const router = useRouter();
const user = computed(() => auth.user);
const username = computed(() => user.value?.username || "User");
const roleNames = computed(() => (user.value?.roles || []).map(role => role.name));
const permissions = computed(() => user.value?.permissions || []);
const isAdmin = computed(() =>
  user.value?.roles.some(
    role => role.code === RoleCode.ADMIN
  ) ?? false
);function can(permission: string) { return auth.can(permission); }
const modules = computed(() => [
  {
    title: "Employee Management",
    description:
      "Manage employee profiles, departments, positions, and contracts.",
    icon: Users,
    permission: "employees.view",
    route: "/employees",
    status: "Upcoming",
  },
  {
    title: "Payroll Processing",
    description:
      "Prepare payroll periods, compensation, and deductions.",
    icon: Calculator,
    permission: "payroll.view",
    route: "/payroll",
    status: "Upcoming",
  },
  {
    title: "Payroll Review",
    description:
      "Review and authorize payroll processing records.",
    icon: ClipboardCheck,
    permission: "payroll.review",
    route: "/payroll/review",
    status: "Upcoming",
  },
  {
    title: "Reports & Printing",
    description:
      "Prepare official payroll reports and printable documents.",
    icon: FileText,
    permission: "payroll.view",
    route: "/reports",
    status: "Upcoming",
  },
  {
    title: "User Management",
    description:
      "Manage system accounts, roles, and access permissions.",
    icon: ShieldCheck,
    permission: "users.manage",
    route: "/dashboard/users",
    status: "Phase 1",
  },
]);

function openModule(module: { route: string; status: string }) {
  if (module.status === "Phase 1") router.push(module.route);
}

const visibleModules = computed(() =>
  modules.value.filter((module) =>
    can(module.permission)
  )
);

</script>
<template>
      <main class="dashboard-content">
        <!-- PAGE HEADING -->
        <div class="page-heading">
          <div>
            <div class="page-eyebrow">
              <span class="eyebrow-line"></span>
              PROVINCIAL PAYROLL WORKSPACE
            </div>

            <h1>Welcome back, {{ username }}.</h1>

            <p>
              Your central workspace for managing
              JO/COS payroll operations.
            </p>
          </div>

          <div class="page-status">
            <span class="status-dot"></span>
            Authenticated Session
          </div>
        </div>

        <!-- WELCOME BANNER -->
        <section class="welcome-banner">
          <div class="welcome-banner-overlay"></div>

          <div class="welcome-banner-content">
            <div class="banner-label">
              <ShieldCheck :size="16" />
              JOCOS PAYROLL 2.0
            </div>

            <h2>
              Efficient payroll.
              <span>Accountable public service.</span>
            </h2>

            <p>
              Manage payroll operations with
              secure, role-based access to your workspace.
            </p>

            <div class="banner-role">
              <Fingerprint :size="16" />
              {{ roleNames.join(", ") || "Authorized User" }}
            </div>
          </div>

          <div class="banner-decoration"></div>
        </section>

        <!-- OVERVIEW -->
        <section class="overview-section">
          <div class="section-heading">
            <div>
              <h2>Workspace Overview</h2>
              <p>Current system access and module availability.</p>
            </div>

            <span class="section-meta">PHASE 1 · AUTH & RBAC</span>
          </div>

          <div class="overview-grid">
            <div class="overview-card">
              <div class="overview-icon green">
                <ShieldCheck :size="22" />
              </div>

              <div class="overview-card-body">
                <span>Account Status</span>
                <strong>{{ user?.is_active ? "Active" : "Inactive" }}</strong>
                <small>Authenticated user account</small>
              </div>
            </div>

            <div class="overview-card">
              <div class="overview-icon blue">
                <Fingerprint :size="22" />
              </div>

              <div class="overview-card-body">
                <span>Assigned Roles</span>
                <strong>{{ roleNames.length }}</strong>
                <small>Roles linked to your account</small>
              </div>
            </div>

            <div class="overview-card">
              <div class="overview-icon amber">
                <LockKeyhole :size="22" />
              </div>

              <div class="overview-card-body">
                <span>Permissions</span>
                <strong>{{ permissions.length }}</strong>
                <small>Effective access permissions</small>
              </div>
            </div>

            <div class="overview-card">
              <div class="overview-icon purple">
                <Activity :size="22" />
              </div>

              <div class="overview-card-body">
                <span>System Phase</span>
                <strong>Phase 1</strong>
                <small>Authentication & access control</small>
              </div>
            </div>
          </div>
        </section>

        <!-- MODULES -->
        <section class="modules-section">
          <div class="section-heading">
            <div>
              <h2>System Modules</h2>
              <p>
                Modules visible according to your assigned permissions.
              </p>
            </div>
          </div>

          <div class="modules-grid">
            <article
              v-for="module in visibleModules"
              :key="module.title"
              class="module-card"
              :class="{ clickable: module.status === 'Phase 1' }"
              :role="module.status === 'Phase 1' ? 'link' : undefined"
              :tabindex="module.status === 'Phase 1' ? 0 : undefined"
              @click="openModule(module)"
              @keydown.enter="openModule(module)"
            >
              <div class="module-card-header">
                <div class="module-icon">
                  <component :is="module.icon" :size="22" />
                </div>

                <span class="module-badge">
                  {{ module.status }}
                </span>
              </div>

              <h3>{{ module.title }}</h3>
              <p>{{ module.description }}</p>

              <div class="module-footer">
                <span>{{ module.status === "Phase 1" ? "Open module" : "Under development" }}</span>
                <ArrowRight :size="17" />
              </div>
            </article>
          </div>

          <div
            v-if="visibleModules.length === 0"
            class="empty-modules"
          >
            <LockKeyhole :size="25" />
            <h3>No modules assigned</h3>
            <p>
              Contact your system administrator
              to request the appropriate permissions.
            </p>
          </div>
        </section>

        <!-- ACCESS DETAILS -->
        <section class="access-details-section">
          <div class="section-heading">
            <div>
              <h2>Account & Access</h2>
              <p>Your authenticated identity and access assignments.</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-card">
              <div class="details-title">
                <Users :size="19" />
                Account Information
              </div>

              <div class="detail-row">
                <span>Username</span>
                <strong>{{ username }}</strong>
              </div>

              <div class="detail-row">
                <span>Email</span>
                <strong>{{ user?.email || "Not provided" }}</strong>
              </div>

              <div class="detail-row">
                <span>Account Status</span>
                <strong class="status-active">
                  {{ user?.is_active ? "Active" : "Inactive" }}
                </strong>
              </div>

              <div class="detail-row">
                <span>Access Level</span>
                <strong>{{ isAdmin ? "Administrator" : "Assigned User" }}</strong>
              </div>
            </div>

            <div class="details-card">
              <div class="details-title">
                <ShieldCheck :size="19" />
                Roles & Permissions
              </div>

              <div class="access-subtitle">ASSIGNED ROLES</div>

              <div class="role-chips">
                <span
                  v-for="role in roleNames"
                  :key="role"
                  class="role-chip"
                >
                  {{ role }}
                </span>

                <span v-if="roleNames.length === 0" class="empty-text">
                  No roles assigned
                </span>
              </div>

              <div class="access-subtitle permission-title">
                EFFECTIVE PERMISSIONS
              </div>

              <div class="permission-chips">
                <span
                  v-for="permission in permissions"
                  :key="permission"
                  class="permission-chip"
                >
                  {{ permission }}
                </span>

                <span v-if="permissions.length === 0" class="empty-text">
                  No permissions assigned
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer class="dashboard-footer">
          <span>JOCOS Payroll 2.0 · Province of Negros Occidental</span>
          <span>Internal Government Payroll Management System</span>
        </footer>
      </main>
</template>
<style scoped>
.dashboard-content { --border: #e5ebe7; --ink: #193029; }

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
.module-card.clickable { cursor: pointer; }
.module-card.clickable:hover { border-color: #7bcba0; box-shadow: 0 8px 24px #0c2b1c12; }

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
