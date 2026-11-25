
<script setup lang="ts">
import {
  computed,
  reactive,
  ref,
  onMounted,
} from "vue";

import {
  Building2,
  Hospital,
  Network,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-vue-next";

import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

// ==========================================
// TYPES
// ==========================================

type UnitType = "provincial_office" | "hospital";

interface OrganizationalUnit {
  id: number;
  code: string;
  name: string;
  type: UnitType;
  is_active: boolean;
}

// ==========================================
// ACCESS CONTROL
// ==========================================

const canManage = computed(() => {
  const roles = new Set(
    (auth.user?.roles || []).map(
      (role: any) =>
        typeof role === "string"
          ? role
          : role.code
    )
  );

  return roles.size === 1 && roles.has("ADMIN");
});

// ==========================================
// STATE
// ==========================================

const units = ref<OrganizationalUnit[]>([]);

const search = ref("");
const typeFilter = ref("all");
const statusFilter = ref("all");

const loading = ref(false);
const saving = ref(false);

const error = ref("");
const formError = ref("");
const successMessage = ref("");

const modalOpen = ref(false);
const statusModalOpen = ref(false);

const editingId = ref<number | null>(null);

const statusTarget =
  ref<OrganizationalUnit | null>(null);

const form = reactive({
  code: "",
  name: "",
  type: "provincial_office" as UnitType,
  is_active: true,
});

// ==========================================
// STATISTICS
// ==========================================

const totalOffices = computed(() =>
  units.value.filter(
    (unit) => unit.type === "provincial_office"
  ).length
);

const totalHospitals = computed(() =>
  units.value.filter(
    (unit) => unit.type === "hospital"
  ).length
);

const activeCount = computed(() =>
  units.value.filter(
    (unit) => unit.is_active
  ).length
);

const inactiveCount = computed(() =>
  units.value.filter(
    (unit) => !unit.is_active
  ).length
);

const filteredUnits = computed(() => {
  const keyword = search.value
    .trim()
    .toLowerCase();

  return units.value.filter((unit) => {
    const matchesSearch =
      !keyword ||
      unit.code.toLowerCase().includes(keyword) ||
      unit.name.toLowerCase().includes(keyword);

    const matchesType =
      typeFilter.value === "all" ||
      unit.type === typeFilter.value;

    const matchesStatus =
      statusFilter.value === "all" ||
      (
        statusFilter.value === "active" &&
        unit.is_active
      ) ||
      (
        statusFilter.value === "inactive" &&
        !unit.is_active
      );

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus
    );
  });
});

// ==========================================
// HELPERS
// ==========================================

function formatType(type: UnitType) {
  return type === "hospital"
    ? "Hospital"
    : "Provincial Office";
}

function getError(
  err: unknown,
  fallback: string
): string {
  const detail = (
    err as {
      response?: {
        data?: {
          detail?: unknown;
        };
      };
    }
  )?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field =
          item.loc?.[item.loc.length - 1];

        return `${field || "Field"}: ${
          item.msg || "Invalid value"
        }`;
      })
      .join(". ");
  }

  return fallback;
}

// ==========================================
// LOAD ORGANIZATIONAL UNITS
// ==========================================

async function loadUnits() {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await api.get<
      OrganizationalUnit[]
    >("/organizational-units");

    units.value = response.data;
  } catch (err) {
    error.value = getError(
      err,
      "Unable to load organizational units."
    );
  } finally {
    loading.value = false;
  }
}

// ==========================================
// CREATE / EDIT MODAL
// ==========================================

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    type: "provincial_office",
    is_active: true,
  });

  formError.value = "";
}

function openCreateModal() {
  if (!canManage.value) return;

  editingId.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEditModal(
  unit: OrganizationalUnit
) {
  if (!canManage.value) return;

  resetForm();

  editingId.value = unit.id;

  Object.assign(form, {
    code: unit.code,
    name: unit.name,
    type: unit.type,
    is_active: unit.is_active,
  });

  modalOpen.value = true;
}

function closeModal() {
  if (saving.value) return;

  modalOpen.value = false;
  editingId.value = null;
  resetForm();
}

// ==========================================
// VALIDATION
// ==========================================

function validateForm(): boolean {
  formError.value = "";

  if (!form.code.trim()) {
    formError.value =
      "Organizational unit code is required.";

    return false;
  }

  if (!form.name.trim()) {
    formError.value =
      "Organizational unit name is required.";

    return false;
  }

  if (form.code.trim().length > 50) {
    formError.value =
      "Unit code cannot exceed 50 characters.";

    return false;
  }

  if (form.name.trim().length > 255) {
    formError.value =
      "Unit name cannot exceed 255 characters.";

    return false;
  }

  return true;
}

// ==========================================
// SAVE ORGANIZATIONAL UNIT
// ==========================================

async function saveUnit() {
  if (!canManage.value || saving.value) {
    return;
  }

  if (!validateForm()) return;

  saving.value = true;
  successMessage.value = "";

  const payload = {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    type: form.type,
  };

  try {
    if (editingId.value === null) {
      await api.post(
        "/organizational-units",
        payload
      );

      successMessage.value =
        "Organizational unit created successfully.";
    } else {
      await api.patch(
        `/organizational-units/${editingId.value}`,
        {
          ...payload,
          is_active: form.is_active,
        }
      );

      successMessage.value =
        "Organizational unit updated successfully.";
    }

    modalOpen.value = false;
    editingId.value = null;

    resetForm();

    await loadUnits();
  } catch (err) {
    formError.value = getError(
      err,
      "Unable to save organizational unit."
    );
  } finally {
    saving.value = false;
  }
}

// ==========================================
// STATUS MANAGEMENT
// ==========================================

function openStatusModal(
  unit: OrganizationalUnit
) {
  if (!canManage.value) return;

  statusTarget.value = unit;
  formError.value = "";
  statusModalOpen.value = true;
}

function closeStatusModal() {
  if (saving.value) return;

  statusModalOpen.value = false;
  statusTarget.value = null;
  formError.value = "";
}

async function updateStatus() {
  if (
    !canManage.value ||
    !statusTarget.value ||
    saving.value
  ) {
    return;
  }

  saving.value = true;
  formError.value = "";
  successMessage.value = "";

  const unit = statusTarget.value;
  const nextStatus = !unit.is_active;

  try {
    await api.patch(
      `/organizational-units/${unit.id}`,
      {
        code: unit.code,
        name: unit.name,
        type: unit.type,
        is_active: nextStatus,
      }
    );

    successMessage.value =
      `Organizational unit ${
        nextStatus
          ? "activated"
          : "deactivated"
      } successfully.`;

    statusModalOpen.value = false;
    statusTarget.value = null;

    await loadUnits();
  } catch (err) {
    formError.value = getError(
      err,
      "Unable to update organizational unit status."
    );
  } finally {
    saving.value = false;
  }
}

onMounted(loadUnits);
</script>

<template>
  <div class="units-page">

    <!-- PAGE HEADER -->
    <header class="page-header">
      <div>
        <span class="eyebrow">
          MASTER DATA
        </span>

        <h1>Organizational Units</h1>

        <p>
          Manage provincial offices, hospitals
          and organizational access boundaries.
        </p>
      </div>

      <button
        v-if="canManage"
        type="button"
        class="primary-button"
        @click="openCreateModal"
      >
        <Plus :size="18" />
        Add Organizational Unit
      </button>
    </header>

    <!-- SUCCESS MESSAGE -->
    <div
      v-if="successMessage"
      class="success-message"
      role="status"
    >
      <CheckCircle2 :size="19" />

      <span>{{ successMessage }}</span>

      <button
        type="button"
        class="icon-button"
        aria-label="Dismiss notification"
        @click="successMessage = ''"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- STATISTICS -->
    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon green">
          <Network :size="24" />
        </div>

        <div>
          <span>Total Units</span>
          <strong>
            {{ loading ? "—" : units.length }}
          </strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon green">
          <Building2 :size="24" />
        </div>

        <div>
          <span>Provincial Offices</span>
          <strong>
            {{ loading ? "—" : totalOffices }}
          </strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon blue">
          <Hospital :size="24" />
        </div>

        <div>
          <span>Hospitals</span>
          <strong>
            {{ loading ? "—" : totalHospitals }}
          </strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon green">
          <CheckCircle2 :size="24" />
        </div>

        <div>
          <span>Active Units</span>
          <strong>
            {{ loading ? "—" : activeCount }}
          </strong>

          <small>
            {{ inactiveCount }} inactive
          </small>
        </div>
      </article>
    </section>

    <!-- DIRECTORY -->
    <section class="records-card">
      <header class="records-header">
        <div>
          <h2>Organizational Unit Directory</h2>

          <p>
            View and maintain organizational units.
          </p>
        </div>

        <button
          type="button"
          class="secondary-button"
          :disabled="loading"
          @click="loadUnits"
        >
          <RefreshCw
            :size="16"
            :class="{ spinning: loading }"
          />
          Refresh
        </button>
      </header>

      <!-- FILTERS -->
      <div class="toolbar">
        <div class="search-field">
          <Search :size="18" />

          <input
            v-model="search"
            type="search"
            placeholder="Search organizational units..."
            aria-label="Search organizational units"
          />
        </div>

        <select
          v-model="typeFilter"
          aria-label="Filter by unit type"
        >
          <option value="all">
            All Unit Types
          </option>

          <option value="provincial_office">
            Provincial Offices
          </option>

          <option value="hospital">
            Hospitals
          </option>
        </select>

        <select
          v-model="statusFilter"
          aria-label="Filter by status"
        >
          <option value="all">
            All Statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      <!-- ERROR -->
      <div
        v-if="error"
        class="error-message directory-error"
        role="alert"
      >
        <AlertCircle :size="18" />
        {{ error }}
      </div>

      <!-- TABLE -->
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Unit Code</th>
              <th>Organizational Unit</th>
              <th>Unit Type</th>
              <th>Status</th>
              <th v-if="canManage">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td
                :colspan="canManage ? 5 : 4"
                class="table-state"
              >
                <LoaderCircle
                  :size="26"
                  class="spinning"
                />

                <p>
                  Loading organizational units...
                </p>
              </td>
            </tr>

            <tr
              v-for="unit in loading || error
                ? []
                : filteredUnits"
              :key="unit.id"
            >
              <td>
                <span class="unit-code">
                  {{ unit.code }}
                </span>
              </td>

              <td>
                <div class="unit-name">
                  <div
                    class="unit-icon"
                    :class="unit.type"
                  >
                    <Hospital
                      v-if="unit.type === 'hospital'"
                      :size="20"
                    />

                    <Building2
                      v-else
                      :size="20"
                    />
                  </div>

                  <strong>{{ unit.name }}</strong>
                </div>
              </td>

              <td>
                <span
                  class="type-badge"
                  :class="unit.type"
                >
                  {{ formatType(unit.type) }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    unit.is_active
                      ? 'active'
                      : 'inactive'
                  "
                >
                  <span class="status-dot"></span>

                  {{
                    unit.is_active
                      ? "Active"
                      : "Inactive"
                  }}
                </span>
              </td>

              <td v-if="canManage">
                <div class="table-actions">
                  <button
                    type="button"
                    class="edit-button"
                    @click="openEditModal(unit)"
                  >
                    <Pencil :size="14" />
                    Edit
                  </button>

                  <button
                    type="button"
                    class="status-button"
                    :class="{
                      deactivate: unit.is_active
                    }"
                    @click="openStatusModal(unit)"
                  >
                    <Power :size="14" />

                    {{
                      unit.is_active
                        ? "Deactivate"
                        : "Activate"
                    }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- EMPTY STATE -->
            <tr
              v-if="
                !loading &&
                !error &&
                filteredUnits.length === 0
              "
            >
              <td
                :colspan="canManage ? 5 : 4"
                class="table-state"
              >
                <div class="empty-state">
                  <div class="empty-icon">
                    <Network :size="30" />
                  </div>

                  <h3>
                    No organizational units found
                  </h3>

                  <p>
                    {{
                      search ||
                      typeFilter !== "all" ||
                      statusFilter !== "all"
                        ? "Try changing your search or filters."
                        : "Register your first provincial office or hospital."
                    }}
                  </p>

                  <button
                    v-if="
                      canManage &&
                      units.length === 0
                    "
                    type="button"
                    class="primary-button"
                    @click="openCreateModal"
                  >
                    <Plus :size="17" />
                    Add Organizational Unit
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="table-footer">
        Showing {{ filteredUnits.length }}
        of {{ units.length }} organizational units
      </footer>
    </section>

    <!-- INFORMATION -->
    <section class="access-information">
      <div class="information-icon">
        <Network :size="22" />
      </div>

      <div>
        <h3>Organizational Access Control</h3>

        <p>
          Organizational units define the access
          boundaries of payroll encoders and
          hospital encoders. Departments are
          associated with these units.
        </p>
      </div>
    </section>

    <!-- CREATE / EDIT MODAL -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalOpen"
          class="modal-backdrop"
          @click.self="closeModal"
          @keydown.esc="closeModal"
        >
          <section
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-modal-title"
          >
            <header class="modal-header">
              <div>
                <span class="eyebrow">
                  MASTER DATA
                </span>

                <h2 id="unit-modal-title">
                  {{
                    editingId === null
                      ? "Add Organizational Unit"
                      : "Edit Organizational Unit"
                  }}
                </h2>

                <p>
                  Complete the required information.
                </p>
              </div>

              <button
                type="button"
                class="icon-button"
                aria-label="Close modal"
                :disabled="saving"
                @click="closeModal"
              >
                <X :size="20" />
              </button>
            </header>

            <form @submit.prevent="saveUnit">
              <div class="modal-body">

                <div
                  v-if="formError"
                  class="error-message"
                  role="alert"
                >
                  <AlertCircle :size="18" />
                  {{ formError }}
                </div>

                <fieldset :disabled="saving">
                  <div class="form-grid">

                    <!-- UNIT TYPE -->
                    <div class="form-group">
                      <label>
                        Organizational Unit Type *
                      </label>

                      <div class="type-options">
                        <label
                          class="type-option"
                          :class="{
                            selected:
                              form.type ===
                              'provincial_office'
                          }"
                        >
                          <input
                            v-model="form.type"
                            type="radio"
                            value="provincial_office"
                            :disabled="editingId !== null"
                          />

                          <Building2 :size="24" />

                          <strong>
                            Provincial Office
                          </strong>

                          <small>
                            Provincial government offices
                          </small>
                        </label>

                        <label
                          class="type-option"
                          :class="{
                            selected:
                              form.type === 'hospital'
                          }"
                        >
                          <input
                            v-model="form.type"
                            type="radio"
                            value="hospital"
                            :disabled="editingId !== null"
                          />

                          <Hospital :size="24" />

                          <strong>Hospital</strong>

                          <small>
                            Provincial and district hospitals
                          </small>
                        </label>
                      </div>

                      <small v-if="editingId !== null">
                        Unit type is locked during editing
                        to protect existing access assignments.
                      </small>
                    </div>

                    <!-- UNIT CODE -->
                    <div class="form-group">
                      <label for="unit-code">
                        Unit Code *
                      </label>

                      <input
                        id="unit-code"
                        v-model="form.code"
                        type="text"
                        maxlength="50"
                        placeholder="e.g. ICTD"
                        required
                      />
                    </div>

                    <!-- UNIT NAME -->
                    <div class="form-group">
                      <label for="unit-name">
                        Organizational Unit Name *
                      </label>

                      <input
                        id="unit-name"
                        v-model="form.name"
                        type="text"
                        maxlength="255"
                        placeholder="Enter organizational unit name"
                        required
                      />
                    </div>
                  </div>
                </fieldset>

                <div class="information-note">
                  <AlertCircle :size="18" />

                  <span>
                    This organizational unit can be
                    associated with departments and
                    assigned to authorized encoders.
                  </span>
                </div>
              </div>

              <footer class="modal-footer">
                <button
                  type="button"
                  class="secondary-button"
                  :disabled="saving"
                  @click="closeModal"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  class="primary-button"
                  :disabled="saving"
                >
                  <LoaderCircle
                    v-if="saving"
                    :size="17"
                    class="spinning"
                  />

                  <Save v-else :size="17" />

                  {{
                    saving
                      ? "Saving..."
                      : editingId === null
                        ? "Create Organizational Unit"
                        : "Save Changes"
                  }}
                </button>
              </footer>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>

    <!-- STATUS CONFIRMATION -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="statusModalOpen && statusTarget"
          class="modal-backdrop"
          @click.self="closeStatusModal"
          @keydown.esc="closeStatusModal"
        >
          <section
            class="modal confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
          >
            <header class="modal-header">
              <div>
                <span class="eyebrow">
                  STATUS MANAGEMENT
                </span>

                <h2 id="status-modal-title">
                  {{
                    statusTarget.is_active
                      ? "Deactivate"
                      : "Activate"
                  }}
                  Organizational Unit
                </h2>
              </div>

              <button
                type="button"
                class="icon-button"
                aria-label="Close modal"
                :disabled="saving"
                @click="closeStatusModal"
              >
                <X :size="20" />
              </button>
            </header>

            <div class="modal-body">
              <div
                v-if="formError"
                class="error-message"
                role="alert"
              >
                <AlertCircle :size="18" />
                {{ formError }}
              </div>

              <p class="confirmation-text">
                Are you sure you want to
                {{
                  statusTarget.is_active
                    ? "deactivate"
                    : "activate"
                }}
                <strong>
                  {{ statusTarget.name }}
                </strong>?
              </p>

              <div
                v-if="statusTarget.is_active"
                class="information-note"
              >
                <AlertCircle :size="18" />

                <span>
                  Inactive units should not be used
                  for new department or encoder
                  assignments. Review existing
                  assignments before proceeding.
                </span>
              </div>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="secondary-button"
                :disabled="saving"
                @click="closeStatusModal"
              >
                Cancel
              </button>

              <button
                type="button"
                :class="
                  statusTarget.is_active
                    ? 'danger-button'
                    : 'primary-button'
                "
                :disabled="saving"
                @click="updateStatus"
              >
                <LoaderCircle
                  v-if="saving"
                  :size="17"
                  class="spinning"
                />

                <Power v-else :size="17" />

                {{
                  saving
                    ? "Updating..."
                    : statusTarget.is_active
                      ? "Deactivate"
                      : "Activate"
                }}
              </button>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.units-page {
  min-height: calc(100vh - 76px);
  padding: 34px;
  color: #19372b;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 28px;
}

.eyebrow {
  color: #087452;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
}

.page-header h1 {
  margin: 12px 0 8px;
  font-size: 30px;
  letter-spacing: -0.8px;
}

.page-header p,
.records-header p,
.modal-header p {
  margin: 0;
  color: #83948a;
  font-size: 13px;
  line-height: 1.7;
}

/* BUTTONS */

.primary-button,
.secondary-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 17px;
  border-radius: 9px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.primary-button {
  background: #087452;
  border: 1px solid #087452;
  color: white;
}

.primary-button:hover {
  background: #065b41;
}

.secondary-button {
  background: white;
  border: 1px solid #dce8df;
  color: #245b42;
}

.secondary-button:hover {
  background: #f3f8f4;
}

.danger-button {
  background: #b34343;
  border: 1px solid #b34343;
  color: white;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid #dfe8e1;
  border-radius: 8px;
  background: white;
  color: #526b5a;
  cursor: pointer;
}

/* STATISTICS */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 26px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 22px;
  background: white;
  border: 1px solid #e4ebe6;
  border-radius: 14px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 49px;
  height: 49px;
  flex-shrink: 0;
  border-radius: 12px;
}

.stat-icon.green {
  background: #e4f4e9;
  color: #087452;
}

.stat-icon.blue {
  background: #e8f0fa;
  color: #386ca3;
}

.stat-card span,
.stat-card strong,
.stat-card small {
  display: block;
}

.stat-card span {
  color: #819287;
  font-size: 12px;
}

.stat-card strong {
  margin-top: 7px;
  font-size: 27px;
}

.stat-card small {
  margin-top: 4px;
  color: #91a096;
  font-size: 10px;
}

/* DIRECTORY */

.records-card {
  background: white;
  border: 1px solid #e4ebe6;
  border-radius: 14px;
  overflow: hidden;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 24px;
}

.records-header h2 {
  margin: 0 0 6px;
  font-size: 17px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 24px 22px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
  padding: 0 14px;
  border: 1px solid #dce7df;
  border-radius: 9px;
  color: #8a9d90;
}

.search-field:focus-within {
  border-color: #087452;
}

.search-field input {
  width: 100%;
  padding: 13px 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
}

.toolbar select {
  padding: 11px 13px;
  border: 1px solid #dce7df;
  border-radius: 9px;
  background: white;
  color: #526b5a;
  font-family: inherit;
  font-size: 12px;
}

/* TABLE */

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  padding: 15px 20px;
  background: #f7faf8;
  color: #83968a;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  white-space: nowrap;
}

td {
  padding: 18px 20px;
  border-top: 1px solid #edf1ee;
  font-size: 12px;
}

tbody tr:hover {
  background: #fbfdfb;
}

.unit-code {
  color: #087452;
  font-weight: 700;
  white-space: nowrap;
}

.unit-name {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}

.unit-icon {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  border-radius: 9px;
  flex-shrink: 0;
}

.unit-icon.provincial_office {
  background: #e8f5ec;
  color: #087452;
}

.unit-icon.hospital {
  background: #e8f0fa;
  color: #386ca3;
}

.type-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 30px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.type-badge.provincial_office {
  background: #edf4ef;
  color: #526b5a;
}

.type-badge.hospital {
  background: #e8f0fa;
  color: #386ca3;
}

.status-badge.active {
  background: #e8f5ec;
  color: #087452;
}

.status-badge.inactive {
  background: #eef0ef;
  color: #7b8b81;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.table-actions {
  display: flex;
  gap: 7px;
}

.edit-button,
.status-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 7px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.edit-button {
  background: #f0f6fb;
  border: 1px solid #dce5eb;
  color: #41627d;
}

.status-button {
  background: #eff8f1;
  border: 1px solid #cde5d4;
  color: #087452;
}

.status-button.deactivate {
  background: #fff5f3;
  border-color: #f0d8d4;
  color: #b34343;
}

.table-footer {
  padding: 20px 24px;
  border-top: 1px solid #edf1ee;
  color: #85968a;
  font-size: 11px;
}

.table-state {
  padding: 45px;
  text-align: center;
  color: #91a096;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #edf6ef;
  color: #087452;
}

.empty-state h3 {
  margin: 17px 0 7px;
  font-size: 16px;
  color: #244434;
}

.empty-state p {
  margin: 0 0 20px;
  font-size: 12px;
}

/* INFORMATION */

.access-information {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 24px;
  padding: 22px;
  background: #f2f8f4;
  border: 1px solid #dce9e0;
  border-radius: 12px;
}

.information-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #e1f0e6;
  color: #087452;
}

.access-information h3 {
  margin: 0 0 7px;
  font-size: 14px;
}

.access-information p {
  margin: 0;
  color: #668474;
  font-size: 12px;
  line-height: 1.8;
}

/* NOTIFICATIONS */

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 17px;
  margin-bottom: 18px;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.7;
}

.success-message {
  background: #eaf7ee;
  border: 1px solid #cbe6d4;
  color: #167448;
}

.success-message span {
  flex: 1;
}

.error-message {
  background: #fff1f0;
  border: 1px solid #f3d1d1;
  color: #b34343;
}

.directory-error {
  margin: 0 24px 18px;
}

.error-message svg,
.information-note svg {
  flex-shrink: 0;
}

/* MODALS */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #071d1699;
  backdrop-filter: blur(3px);
}

.modal {
  width: 100%;
  max-width: 650px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  background: white;
  color: #19372b;
  border-radius: 17px;
  box-shadow: 0 20px 70px #0002;
}

.confirmation-modal {
  max-width: 480px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  padding: 25px;
  border-bottom: 1px solid #edf1ee;
}

.modal-header h2 {
  margin: 9px 0 8px;
  font-size: 21px;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #edf1ee;
  background: #fafcfb;
}

/* FORM */

fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.form-grid {
  display: grid;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group > label {
  color: #365344;
  font-size: 12px;
  font-weight: 700;
}

.form-group input[type="text"] {
  box-sizing: border-box;
  width: 100%;
  min-height: 43px;
  padding: 11px 13px;
  border: 1px solid #dce7df;
  border-radius: 8px;
  outline: none;
  background: white;
  color: #19372b;
  font-family: inherit;
  font-size: 12px;
}

.form-group input[type="text"]:focus {
  border-color: #087452;
  box-shadow: 0 0 0 3px #08745212;
}

.form-group small {
  color: #91a096;
  font-size: 11px;
  line-height: 1.6;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.type-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 20px;
  border: 1px solid #dce7df;
  border-radius: 11px;
  color: #526b5a;
  cursor: pointer;
}

.type-option input {
  position: absolute;
  top: 15px;
  right: 15px;
  accent-color: #087452;
}

.type-option.selected {
  background: #f0f8f3;
  border-color: #087452;
  color: #087452;
}

.type-option strong {
  font-size: 13px;
}

.information-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  margin-top: 22px;
  border: 1px solid #dce9e0;
  border-radius: 8px;
  background: #f4f9f5;
  color: #5d7d69;
  font-size: 11px;
  line-height: 1.7;
}

.confirmation-text {
  margin: 0;
  color: #526b5a;
  font-size: 13px;
  line-height: 1.8;
}

/* ANIMATIONS */

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RESPONSIVE */

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .units-page {
    padding: 18px;
  }

  .page-header {
    flex-direction: column;
  }

  .stats-grid,
  .type-options {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
  }

  .modal-backdrop {
    padding: 12px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }

  .modal-footer {
    flex-wrap: wrap;
  }
}
</style>
