<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

type Role = {
  id: number;
  code: string;
  name: string;
};

type User = {
  id: number;
  employee_id: number | null;
  username: string;
  email: string | null;
  is_active: boolean;
  must_change_password: boolean;
  password_reset_at: string | null;
  password_changed_at: string | null;
  created_at: string;
  roles: Role[];
};

type Unit = {
  id: number;
  code: string;
  name: string;
  type: "provincial_office" | "hospital";
  is_active: boolean;
};

type AssignmentResponse = {
  user_id: number;
  organizational_unit_ids: number[];
};

const router = useRouter();
const auth = useAuthStore();

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const units = ref<Unit[]>([]);
const assignments = ref<Record<number, number[]>>({});

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const notice = ref("");
const search = ref("");
const statusFilter = ref("all");
const modalOpen = ref(false);
const editingId = ref<number | null>(null);

const resetTarget = ref<User | null>(null);
const temporaryPassword = ref("");
const showTemporaryPassword = ref(false);
const resettingPassword = ref(false);
const resetError = ref("");
const credentialsConfirmed = ref(false);
const updatingStatus = ref(false);

function isEmployeeUser(user: User): boolean {
  return user.roles.some(
    role => role.code === "EMPLOYEE"
  );
}

function canActivate(user: User): boolean {
  if (user.is_active) return false;

  if (isEmployeeUser(user)) {
    return (
      user.roles.length === 1 &&
      user.employee_id !== null &&
      Boolean(user.password_reset_at)
    );
  }

  return user.roles.length > 0;
}

function canResetPassword(user: User): boolean {
  return (
    auth.isAdmin &&
    user.id !== auth.user?.id &&
    isEmployeeUser(user) &&
    user.roles.length === 1 &&
    user.employee_id !== null
  );
}

function getSecurityStatus(user: User): string {
  if (isEmployeeUser(user)) {
    if (user.employee_id === null) {
      return "Employee link required";
    }

    if (!user.password_reset_at) {
      return "Password reset required";
    }
  }

  if (user.must_change_password) {
    return "Password change required";
  }

  return "Password configured";
}

const form = reactive({
  username: "",
  email: "",
  password: "",
  role_id: "",
  unit_ids: [] as number[],
});

const isEditing = computed(() => editingId.value !== null);

const selectedRole = computed(() =>
  roles.value.find((role) => role.id === Number(form.role_id))
);

const editingUser = computed(() => users.value.find(user => user.id === editingId.value));
const isEmployeeAccount = computed(() => editingUser.value?.roles.some(role => role.code === "EMPLOYEE") ?? false);
const availableRoles = computed(() => roles.value.filter(role => isEmployeeAccount.value ? role.code === "EMPLOYEE" : role.code !== "EMPLOYEE"));

const isHospitalEncoder = computed(
  () => selectedRole.value?.code === "HOSPITAL_ENCODER"
);

const isPayrollEncoder = computed(
  () => selectedRole.value?.code === "PAYROLL_ENCODER"
);

const isEncoder = computed(
  () => isHospitalEncoder.value || isPayrollEncoder.value
);

const availableUnits = computed(() => {
  const type = isHospitalEncoder.value
    ? "hospital"
    : "provincial_office";

  return units.value.filter(
    (unit) =>
      unit.type === type &&
      (unit.is_active || form.unit_ids.includes(unit.id))
  );
});

const filteredUsers = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return users.value.filter((user) => {
    const matchesSearch =
      !keyword ||
      user.username.toLowerCase().includes(keyword) ||
      (user.email ?? "").toLowerCase().includes(keyword) ||
      user.roles.some((role) =>
        role.name.toLowerCase().includes(keyword)
      );

    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" && user.is_active) ||
      (statusFilter.value === "inactive" && !user.is_active);

    return matchesSearch && matchesStatus;
  });
});

const totalActive = computed(
  () => users.value.filter((user) => user.is_active).length
);

const totalInactive = computed(
  () => users.value.filter((user) => !user.is_active).length
);

function getErrorMessage(err: unknown): string {
  const e = err as {
    response?: {
      data?: { detail?: string | { msg?: string }[] };
    };
    message?: string;
  };

  const detail = e.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg ?? "Invalid field").join("; ");
  }

  return e.message ?? "An unexpected error occurred.";
}

async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const [usersResponse, rolesResponse, unitsResponse] =
      await Promise.all([
        api.get<User[]>("/users"),
        api.get<Role[]>("/roles"),
        api.get<Unit[]>("/organizational-units"),
      ]);

    users.value = usersResponse.data;
    roles.value = rolesResponse.data;
    units.value = unitsResponse.data;

    const results = await Promise.allSettled(
      users.value.map((user) =>
        api.get<AssignmentResponse>(
          `/organizational-units/users/${user.id}`
        )
      )
    );

    const nextAssignments: Record<number, number[]> = {};
    let failed = 0;

    results.forEach((result, index) => {
      const userId = users.value[index].id;

      if (result.status === "fulfilled") {
        nextAssignments[userId] =
          result.value.data.organizational_unit_ids;
      } else {
        failed++;
      }
    });

    assignments.value = nextAssignments;

    if (failed) {
      error.value =
        `Unable to load assignments for ${failed} user(s). ` +
        "Please refresh before editing their access.";
    }
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.username = "";
  form.email = "";
  form.password = "";
  form.role_id = "";
  form.unit_ids = [];
}

function openCreate() {
  resetForm();
  editingId.value = null;
  error.value = "";
  notice.value = "";
  modalOpen.value = true;
}

async function openEdit(user: User) {
  if (!(user.id in assignments.value)) {
    error.value =
      "This user's assignments could not be loaded. Refresh first.";
    return;
  }

  resetForm();
  editingId.value = user.id;
  form.username = user.username;
  form.email = user.email ?? "";
  form.role_id =
    user.roles.length === 1 ? String(user.roles[0].id) : "";
  form.unit_ids = [...assignments.value[user.id]];

  if (user.roles.length !== 1) {
    error.value =
      "This account does not have exactly one role. " +
      "Choose its intended role before saving.";
  } else {
    error.value = "";
  }

  notice.value = "";
  modalOpen.value = true;
}

function closeModal() {
  if (saving.value) return;
  modalOpen.value = false;
  form.password = "";
}

function onRoleChange() {
  form.unit_ids = [];
}

function toggleOffice(id: number) {
  if (form.unit_ids.includes(id)) {
    form.unit_ids = form.unit_ids.filter((value) => value !== id);
  } else {
    form.unit_ids = [...form.unit_ids, id];
  }
}

function getAssignmentNames(userId: number): string {
  const ids = assignments.value[userId];

  if (!ids) return "Unavailable";

  if (!ids.length) return "Not assigned";

  return ids
    .map((id) => units.value.find((unit) => unit.id === id)?.name)
    .filter(Boolean)
    .join(", ") || "Unknown unit";
}

async function saveUser() {
  if (saving.value) return;

  error.value = "";
  notice.value = "";

  if (!availableRoles.value.some(role => role.id === Number(form.role_id))) {
    error.value = "Select an eligible role.";
    return;
  }
  if (editingId.value === auth.user?.id && selectedRole.value?.code !== "ADMIN") {
    error.value = "You cannot remove your own administrator role.";
    return;
  }
  if (!form.role_id) {
    error.value = "Please select a user role.";
    return;
  }

  if (
    isHospitalEncoder.value &&
    form.unit_ids.length !== 1
  ) {
    error.value = "Select exactly one hospital.";
    return;
  }

  if (isPayrollEncoder.value && !form.unit_ids.length) {
    error.value = "Select at least one provincial office.";
    return;
  }

  if (!isEncoder.value && form.unit_ids.length) {
    error.value = "This role cannot have encoder assignments.";
    return;
  }

  if (!isEditing.value && form.password.length < 12) {
    error.value = "Password must contain at least 12 characters.";
    return;
  }

  saving.value = true;

  let savedUserId: number | null = null;

  try {
    const payload = {
      username: form.username.trim(),
      email: form.email.trim() || null,
      role_ids: [Number(form.role_id)],
    };

    if (editingId.value !== null) {
      savedUserId = editingId.value;

      // Remove incompatible assignments before changing role.
      const previousIds =
        assignments.value[editingId.value] ?? [];

      const previousUser = users.value.find(
        (user) => user.id === editingId.value
      );

      const previousRole = previousUser?.roles[0]?.code;
      const newRole = selectedRole.value?.code;

      if (
        previousIds.length &&
        previousRole !== newRole
      ) {
        await api.put(
          `/organizational-units/users/${editingId.value}`,
          { organizational_unit_ids: [] }
        );
      }

      await api.patch(`/users/${editingId.value}`, payload);
    } else {
      const response = await api.post<User>("/users", {
        ...payload,
        password: form.password,
      });

      savedUserId = response.data.id;
    }

    if (!isEmployeeAccount.value) await api.put(
      `/organizational-units/users/${savedUserId}`,
      {
        organizational_unit_ids: isEncoder.value
          ? form.unit_ids
          : [],
      }
    );

    modalOpen.value = false;
    form.password = "";
    await loadData();

    notice.value = isEditing.value
      ? "User updated successfully."
      : "User created and assigned successfully.";
  } catch (err) {
    error.value = getErrorMessage(err);

    if (savedUserId !== null) {
      error.value +=
        " The account or role may have been saved, but the " +
        "full operation did not complete. Review the user " +
        "and assignments before retrying.";
    }

    const saveError = error.value;
    await loadData();
    error.value = saveError;
  } finally {
    saving.value = false;
  }
}

function openPasswordReset(user: User) {
  if (loading.value || updatingStatus.value || saving.value || !canResetPassword(user)) return;

  resetTarget.value = user;
  temporaryPassword.value = "";
  showTemporaryPassword.value = false;
  credentialsConfirmed.value = false;
  resetError.value = "";
  notice.value = "";
}

function closePasswordReset() {
  if (resettingPassword.value) return;

  resetTarget.value = null;
  temporaryPassword.value = "";
  showTemporaryPassword.value = false;
  credentialsConfirmed.value = false;
  resetError.value = "";
}

function generateTemporaryPassword() {
  const bytes = crypto.getRandomValues(
    new Uint8Array(24)
  );

  temporaryPassword.value = Array.from(
    bytes,
    byte => byte.toString(16).padStart(2, "0")
  ).join("");

  showTemporaryPassword.value = true;
  credentialsConfirmed.value = false;
}

async function copyTemporaryPassword() {
  try {
    await navigator.clipboard.writeText(
      temporaryPassword.value
    );
  } catch {
    resetError.value =
      "Unable to copy automatically. Copy the password manually.";
  }
}

async function resetUserPassword() {
  if (
    !resetTarget.value ||
    resettingPassword.value ||
    !canResetPassword(resetTarget.value)
  ) return;

  resetError.value = "";

  if (
    !temporaryPassword.value.trim() ||
    temporaryPassword.value.length < 12 ||
    temporaryPassword.value.length > 128
  ) {
    resetError.value =
      "Password must contain 12 to 128 characters.";
    return;
  }

  if (!credentialsConfirmed.value) {
    resetError.value =
      "Confirm that you have securely recorded the temporary password.";
    return;
  }

  resettingPassword.value = true;

  const target = resetTarget.value;

  try {
    await api.post(
      `/users/${target.id}/reset-password`,
      {
        temporary_password: temporaryPassword.value,
        confirm_password: temporaryPassword.value,
      }
    );

    resettingPassword.value = false;
    closePasswordReset();

    await loadData();

    notice.value =
      `Password reset successfully for ${target.username}. ` +
      "The employee must change their password on their next login.";
  } catch (err) {
    resetError.value = getErrorMessage(err);
  } finally {
    resettingPassword.value = false;
  }
}

async function toggleStatus(user: User) {
  if (updatingStatus.value) return;

  if (
    user.id === auth.user?.id &&
    user.is_active
  ) {
    error.value =
      "You cannot deactivate your own account.";
    return;
  }

  if (
    !user.is_active &&
    !canActivate(user)
  ) {
    error.value =
      "Complete the account security requirements before activation.";
    return;
  }

  const action = user.is_active
    ? "deactivate"
    : "activate";

  if (
    !window.confirm(
      `Are you sure you want to ${action} ${user.username}?`
    )
  ) {
    return;
  }

  error.value = "";
  notice.value = "";
  updatingStatus.value = true;

  try {
    await api.patch(
      `/users/${user.id}/status`,
      {
        is_active: !user.is_active,
      }
    );

    await loadData();

    notice.value =
      `User ${action}d successfully.`;
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    updatingStatus.value = false;
  }
}

onMounted(async () => {
  if (!auth.user && auth.token) {
    await auth.fetchMe();
  }

  if (!auth.can("users.manage")) {
    await router.replace("/dashboard");
    return;
  }

  await loadData();
});
</script>

<template>
  <div class="users-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">SYSTEM ADMINISTRATION</p>
        <h1>Users & Access</h1>
        <p class="subtitle">
          Manage JOCOS Payroll 2.0 accounts, roles, and organizational access.
        </p>
      </div>

      <div class="header-actions">
        <button class="btn secondary" @click="router.push('/dashboard')">
          Back to Dashboard
        </button>
        <button class="btn primary" @click="openCreate">
          + Add User
        </button>
      </div>
    </header>

    <section class="stats">
      <div class="stat">
        <span>Total Accounts</span>
        <strong>{{ users.length }}</strong>
      </div>
      <div class="stat">
        <span>Active Users</span>
        <strong>{{ totalActive }}</strong>
      </div>
      <div class="stat">
        <span>Inactive Users</span>
        <strong>{{ totalInactive }}</strong>
      </div>
      <div class="stat">
        <span>System Roles</span>
        <strong>{{ roles.length }}</strong>
      </div>
    </section>

    <div v-if="notice" class="message success">{{ notice }}</div>
    <div v-if="error" class="message error">{{ error }}</div>

    <section class="panel">
      <div class="toolbar">
        <input
          v-model="search"
          class="input search"
          placeholder="Search username, email, or role..."
        />

        <select v-model="statusFilter" class="input filter">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button class="btn secondary" :disabled="loading" @click="loadData">
          Refresh
        </button>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Organizational Assignment</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="empty">Loading users...</td>
            </tr>

            <tr v-else-if="!filteredUsers.length">
              <td colspan="5" class="empty">No users found.</td>
            </tr>

            <tr v-for="user in filteredUsers" v-else :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="avatar">
                    {{ user.username.slice(0, 2).toUpperCase() }}
                  </div>
                  <div>
                    <strong>{{ user.username }}</strong>
                    <small>{{ user.email || "No email address" }}</small>
                    <small v-if="user.roles.some(role => role.code === 'EMPLOYEE')">{{ user.employee_id ? `Linked employee #${user.employee_id}` : "Unlinked employee account" }}</small>
                  </div>
                </div>
              </td>

              <td>
                <span
                  v-for="role in user.roles"
                  :key="role.id"
                  class="role-pill"
                >
                  {{ role.name }}
                </span>
                <span v-if="!user.roles.length" class="muted">
                  No role
                </span>
              </td>

              <td class="assignment-cell">
                {{ getAssignmentNames(user.id) }}
              </td>

             <td>
  <div class="security-status-cell">
    <span
      class="status"
      :class="user.is_active ? 'active' : 'inactive'"
    >
      {{ user.is_active ? "Active" : "Inactive" }}
    </span>

    <small
      class="security-label"
      :class="{
        warning:
          user.must_change_password ||
          (isEmployeeUser(user) && !user.password_reset_at)
      }"
    >
      {{ getSecurityStatus(user) }}
    </small>
  </div>
</td>

              <td>
  <div class="row-actions">
    <button
      class="link-btn"
      @click="openEdit(user)"
    >
      Edit
    </button>

    <button
      v-if="canResetPassword(user)"
      class="link-btn reset-link"
      @click="openPasswordReset(user)"
    >
      Reset Password
    </button>

    <button
      class="link-btn"
      :class="{ danger: user.is_active }"
      :disabled="
        updatingStatus ||
        (user.id === auth.user?.id && user.is_active) ||
        (!user.is_active && !canActivate(user))
      "
      @click="toggleStatus(user)"
    >
      {{ user.is_active ? "Deactivate" : "Activate" }}
    </button>
  </div>
</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div class="modal-header">
          <div>
            <h2 id="user-modal-title">
              {{ isEditing ? "Edit User" : "Create User" }}
            </h2>
            <p>Configure account and organizational access.</p>
          </div>
          <button
            class="close-button"
            :disabled="saving"
            aria-label="Close"
            @click="closeModal"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="saveUser">
          <div class="modal-body">
            <div class="form-grid">
              <label>
                Username *
                <input
                  v-model="form.username"
                  class="input"
                  minlength="3"
                  maxlength="120"
                  required
                />
              </label>

              <label>
                Email
                <input
                  v-model="form.email"
                  class="input"
                  type="email"
                />
              </label>

              <label v-if="!isEditing">
                Initial Password *
                <input
                  v-model="form.password"
                  class="input"
                  type="password"
                  minlength="12"
                  maxlength="128"
                  autocomplete="new-password"
                  required
                />
              </label>

              <div v-if="isEmployeeAccount" class="employee-account-info full-width">
                <strong>Employee Self-Service Account</strong>
                <p>{{ editingUser?.employee_id ? `Linked employee record #${editingUser.employee_id}` : "Not linked to an employee" }}</p>
                <button type="button" class="btn secondary" @click="router.push('/dashboard/employees')">Go to Employee Management</button>
              </div>

              <label class="full-width">
                System Role *
                <select
                  v-model="form.role_id"
                  class="input"
                  required
                  :disabled="isEmployeeAccount || saving"
                  @change="onRoleChange"
                >
                  <option value="">Select role</option>
                  <option
                    v-for="role in availableRoles"
                    :key="role.id"
                    :value="String(role.id)"
                  >
                    {{ role.name }}
                  </option>
                </select>
              </label>
            </div>

            <div v-if="isEncoder" class="unit-section">
              <h3>
                {{ isHospitalEncoder ? "Hospital Assignment" : "Provincial Office Assignments" }}
              </h3>

              <p>
                {{
                  isHospitalEncoder
                    ? "Choose exactly one hospital for this encoder."
                    : "Select the provincial offices this encoder may access."
                }}
              </p>

              <div v-if="!availableUnits.length" class="empty-units">
                No organizational units are available for this role.
                Create an active unit in the backend first.
              </div>

              <div v-else class="unit-list">
                <label
                  v-for="unit in availableUnits"
                  :key="unit.id"
                  class="unit-option"
                >
                  <input
                    v-if="isHospitalEncoder"
                    v-model="form.unit_ids"
                    type="checkbox"
                    :value="unit.id"
                    :disabled="
                      !form.unit_ids.includes(unit.id) &&
                      form.unit_ids.length >= 1
                    "
                  />
                  <input
                    v-else
                    type="checkbox"
                    :checked="form.unit_ids.includes(unit.id)"
                    @change="toggleOffice(unit.id)"
                  />

                  <span>
                    <strong>{{ unit.name }}</strong>
                    <small>{{ unit.code }}</small>
                  </span>
                </label>
              </div>
            </div>

            <div v-if="error" class="message error">
              {{ error }}
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn secondary"
              :disabled="saving"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn primary"
              :disabled="saving"
            >
              {{ saving ? "Saving..." : isEditing ? "Save Changes" : "Create User" }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="resetTarget" class="modal-overlay" @click.self="closePasswordReset" @keydown.esc.stop="closePasswordReset">
        <section class="modal reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
          <div class="modal-header">
            <div>
              <p class="eyebrow">ACCOUNT SECURITY</p>
              <h2 id="reset-password-title">Reset Password</h2>
              <p>Issue temporary credentials for {{ resetTarget.username }}.</p>
            </div>
            <button type="button" class="close-button" :disabled="resettingPassword" aria-label="Close" @click="closePasswordReset">×</button>
          </div>
          <form @submit.prevent="resetUserPassword">
            <div class="modal-body">
              <div class="reset-warning">
                <strong>Security notice</strong>
                <p>Resetting the password invalidates existing sessions. The employee must change their temporary password on their next login. Account activation is a separate action.</p>
              </div>
              <fieldset :disabled="resettingPassword" class="reset-fieldset">
                <label class="reset-field">
                  Temporary Password
                  <input v-model="temporaryPassword" class="input" :type="showTemporaryPassword ? 'text' : 'password'" minlength="12" maxlength="128" autocomplete="new-password" required @input="credentialsConfirmed = false" />
                </label>
                <div class="password-actions">
                  <button type="button" class="btn secondary" @click="generateTemporaryPassword">Generate Password</button>
                  <button type="button" class="btn secondary" @click="showTemporaryPassword = !showTemporaryPassword">{{ showTemporaryPassword ? 'Hide' : 'Show' }}</button>
                  <button type="button" class="btn secondary" :disabled="!temporaryPassword" @click="copyTemporaryPassword">Copy</button>
                </div>
                <label class="reset-confirmation">
                  <input v-model="credentialsConfirmed" type="checkbox" required />
                  <span>I have securely recorded the temporary password and will provide it directly to the verified employee.</span>
                </label>
              </fieldset>
              <div v-if="resetError" class="message error" role="alert">{{ resetError }}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn secondary" :disabled="resettingPassword" @click="closePasswordReset">Cancel</button>
              <button type="submit" class="btn primary" :disabled="resettingPassword || !credentialsConfirmed || temporaryPassword.length < 12 || temporaryPassword.length > 128">{{ resettingPassword ? 'Resetting...' : 'Reset Password' }}</button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.employee-account-info { padding: 16px; border: 1px solid #cce5d9; border-radius: 10px; background: #f0f8f4; color: #176746; font-size: 13px; }
.employee-account-info p { margin: 8px 0 12px; line-height: 1.6; }

.users-page {
  min-height: 100vh;
  background: #f5f8f7;
  padding: 36px;
  color: #17352f;
  font-family: Inter, system-ui, sans-serif;
}

.page-header,
.header-actions,
.toolbar,
.row-actions,
.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header {
  margin-bottom: 28px;
}

.eyebrow {
  color: #168268;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

h1 {
  font-size: 30px;
  letter-spacing: -1px;
  margin: 5px 0;
}

.subtitle,
.modal-header p {
  color: #71847d;
  font-size: 13px;
}

.btn {
  border: 1px solid #d9e5e0;
  border-radius: 9px;
  padding: 11px 17px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primary {
  background: #087b60;
  color: white;
  border-color: #087b60;
}

.primary:hover:not(:disabled) {
  background: #06694f;
}

.secondary {
  background: white;
  color: #284a40;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat {
  background: white;
  border: 1px solid #e1eae6;
  border-radius: 14px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat span {
  font-size: 12px;
  color: #72867d;
}

.stat strong {
  font-size: 29px;
  letter-spacing: -1px;
}

.panel {
  background: white;
  border: 1px solid #e1eae6;
  border-radius: 15px;
  overflow: hidden;
}

.toolbar {
  padding: 18px;
  justify-content: flex-start;
  flex-wrap: wrap;
  border-bottom: 1px solid #e8eeeb;
}

.input {
  width: 100%;
  min-height: 41px;
  padding: 10px 12px;
  border: 1px solid #d9e5df;
  border-radius: 8px;
  background: white;
  color: #17352f;
  outline: none;
  font: inherit;
  font-size: 13px;
}

.input:focus {
  border-color: #087b60;
  box-shadow: 0 0 0 3px #087b6018;
}

.search {
  flex: 1;
  min-width: 230px;
  max-width: 430px;
}

.filter {
  width: 160px;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

th {
  background: #fbfcfb;
  color: #81928b;
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

th,
td {
  padding: 17px 19px;
  border-bottom: 1px solid #eef2ef;
  vertical-align: middle;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.user-cell strong,
.user-cell small,
.unit-option strong,
.unit-option small {
  display: block;
}

.user-cell small,
.unit-option small {
  color: #87968f;
  margin-top: 4px;
  font-size: 11px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #e3f3ec;
  color: #087b60;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
  flex-shrink: 0;
}

.role-pill {
  display: inline-block;
  padding: 5px 9px;
  background: #edf4f0;
  color: #25644f;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 650;
  margin: 2px;
}

.assignment-cell {
  color: #687f75;
  max-width: 240px;
}

.status {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
}

.status.active {
  background: #e5f7ed;
  color: #168354;
}

.status.inactive {
  background: #f2f3f4;
  color: #89918d;
}

.row-actions {
  justify-content: flex-end;
}

.actions-heading {
  text-align: right;
}

.link-btn {
  background: none;
  border: none;
  color: #087b60;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.link-btn.danger {
  color: #c64b4b;
}

.link-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.empty {
  padding: 45px;
  text-align: center;
  color: #87968f;
}

.muted {
  color: #89968f;
}

.message {
  border-radius: 9px;
  padding: 12px 15px;
  font-size: 13px;
  margin-bottom: 16px;
}

.message.error {
  color: #a12e2e;
  background: #fff0f0;
  border: 1px solid #f5cece;
}

.message.success {
  color: #176746;
  background: #eaf8ef;
  border: 1px solid #c8e9d3;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #10241f99;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.modal {
  background: white;
  border-radius: 17px;
  width: 100%;
  max-width: 640px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 24px 70px #10241f30;
}

.modal-header {
  padding: 23px 25px;
  border-bottom: 1px solid #edf1ee;
}

.modal-header h2 {
  font-size: 20px;
  margin: 0 0 5px;
}

.close-button {
  border: none;
  background: none;
  font-size: 27px;
  cursor: pointer;
  color: #7d8f85;
}

.modal-body {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-grid label {
  font-size: 12px;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width {
  grid-column: 1 / -1;
}

.unit-section {
  margin-top: 25px;
  border-top: 1px solid #e8eeeb;
  padding-top: 22px;
}

.unit-section h3 {
  font-size: 14px;
  margin: 0 0 6px;
}

.unit-section p {
  font-size: 12px;
  color: #84938b;
}

.unit-list {
  display: grid;
  gap: 9px;
  margin-top: 15px;
  max-height: 190px;
  overflow-y: auto;
}

.unit-option {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e1eae6;
  border-radius: 9px;
  padding: 12px;
  cursor: pointer;
}

.unit-option input {
  accent-color: #087b60;
}

.empty-units {
  padding: 20px;
  color: #8b7661;
  background: #fff8eb;
  border-radius: 9px;
  font-size: 12px;
  margin-top: 12px;
}

.modal-footer {
  justify-content: flex-end;
  padding: 18px 24px;
  border-top: 1px solid #edf1ee;
}

@media (max-width: 850px) {
  .users-page {
    padding: 20px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  table {
    min-width: 780px;
  }
}

@media (max-width: 520px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    gap: 9px;
  }

  .stat {
    padding: 15px;
  }

  .stat strong {
    font-size: 23px;
  }

  .header-actions {
    width: 100%;
  }
}

.security-status-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
.security-label { color: #72867d; font-size: 10px; line-height: 1.5; }
.security-label.warning { color: #a16a13; }
.reset-link { color: #a16a13; white-space: nowrap; }
.row-actions { flex-wrap: wrap; }
.reset-modal { max-width: 520px; }
.reset-fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.reset-warning { background: #fffbeb; border: 1px solid #f5e6ba; color: #926319; padding: 15px; border-radius: 10px; font-size: 13px; margin-bottom: 22px; }
.reset-warning p { margin: 7px 0 0; line-height: 1.7; font-size: 12px; }
.reset-field { display: grid; gap: 9px; font-size: 13px; font-weight: 650; }
.reset-field .input { box-sizing: border-box; }
.password-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.reset-confirmation { display: flex; align-items: flex-start; gap: 10px; padding: 15px; background: #f5f8f6; border-radius: 9px; margin: 20px 0; font-size: 12px; line-height: 1.7; color: #647770; }
.reset-confirmation input { accent-color: #087b60; margin-top: 4px; }
</style>
