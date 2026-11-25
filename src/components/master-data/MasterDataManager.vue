
<script setup lang="ts">
import {
  computed,
  ref,
  reactive,
  onMounted,
} from "vue";

import {
  Building2,
  BriefcaseBusiness,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Power,
} from "lucide-vue-next";

import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/auth";

const props = defineProps<{
  mode: "departments" | "positions";
}>();

const auth = useAuthStore();

// ==========================================
// TYPES
// ==========================================

interface OrganizationalUnit {
  id: number;
  code: string;
  name: string;
  type: "provincial_office" | "hospital";
  is_active: boolean;
}

interface MasterRecord {
  id: number;
  office_code?: string;
  name?: string;
  abbreviation?: string | null;
  organizational_unit_id?: number | null;
  organizational_unit?: OrganizationalUnit | null;
  position_code?: string;
  title?: string;
  salary_grade?: number | null;
  standard_monthly_rate?: string | number | null;
  is_active: boolean;
  created_at: string;
}

// ==========================================
// CONFIGURATION
// ==========================================

const isDepartment = computed(
  () => props.mode === "departments"
);

const entity = computed(() =>
  isDepartment.value ? "Department" : "Position"
);

const endpoint = computed(() => `/${props.mode}`);

const pageTitle = computed(
  () => `${entity.value} Management`
);

const pageDescription = computed(() =>
  isDepartment.value
    ? "Manage provincial and hospital departments."
    : "Manage job positions, salary grades and reference rates."
);

const moduleIcon = computed(() =>
  isDepartment.value
    ? Building2
    : BriefcaseBusiness
);

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

const records = ref<MasterRecord[]>([]);
const organizationalUnits = ref<OrganizationalUnit[]>([]);

const search = ref("");
const statusFilter = ref("all");
const unitFilter = ref("");

const loading = ref(false);
const unitsLoading = ref(false);
const saving = ref(false);
const statusSaving = ref(false);

const error = ref("");
const unitError = ref("");
const formError = ref("");
const statusError = ref("");
const successMessage = ref("");

const modalOpen = ref(false);
const statusModalOpen = ref(false);

const editingId = ref<number | null>(null);
const statusTarget = ref<MasterRecord | null>(null);

const form = reactive({
  code: "",
  name: "",
  abbreviation: "",
  organizational_unit_id: "",
  salary_grade: "",
  standard_monthly_rate: "",
});

// ==========================================
// COMPUTED
// ==========================================

const activeCount = computed(
  () => records.value.filter(
    (record) => record.is_active
  ).length
);

const inactiveCount = computed(
  () => records.value.filter(
    (record) => !record.is_active
  ).length
);

const activeUnits = computed(() =>
  organizationalUnits.value.filter(
    (unit) => unit.is_active
  )
);

const filteredRecords = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return records.value.filter((record) => {
    const searchableText = [
      record.office_code,
      record.name,
      record.abbreviation,
      record.position_code,
      record.title,
      record.organizational_unit?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !keyword || searchableText.includes(keyword);

    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" &&
        record.is_active) ||
      (statusFilter.value === "inactive" &&
        !record.is_active);

    const matchesUnit =
      !isDepartment.value ||
      !unitFilter.value ||
      String(record.organizational_unit_id) ===
        unitFilter.value;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesUnit
    );
  });
});

const modalTitle = computed(() =>
  editingId.value === null
    ? `Add ${entity.value}`
    : `Edit ${entity.value}`
);

// ==========================================
// HELPERS
// ==========================================

function recordCode(record: MasterRecord) {
  return isDepartment.value
    ? record.office_code
    : record.position_code;
}

function recordName(record: MasterRecord) {
  return isDepartment.value
    ? record.name
    : record.title;
}

function formatCurrency(
  value: string | number | null | undefined
) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value));
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
        const field = item.loc?.[
          item.loc.length - 1
        ];

        return `${field || "Field"}: ${
          item.msg || "Invalid value"
        }`;
      })
      .join(". ");
  }

  return fallback;
}

// ==========================================
// API REQUESTS
// ==========================================

async function loadRecords() {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await api.get<MasterRecord[]>(
      endpoint.value
    );

    records.value = response.data;
  } catch (err) {
    error.value = getError(
      err,
      `Unable to load ${props.mode}.`
    );
  } finally {
    loading.value = false;
  }
}

async function loadOrganizationalUnits() {
  if (!isDepartment.value || !canManage.value) {
    return;
  }

  unitsLoading.value = true;
  unitError.value = "";

  try {
    const response = await api.get<
      OrganizationalUnit[]
    >("/organizational-units");

    organizationalUnits.value = response.data;
  } catch (err) {
    unitError.value = getError(
      err,
      "Unable to load organizational units."
    );
  } finally {
    unitsLoading.value = false;
  }
}

async function refreshData() {
  await Promise.all([
    loadRecords(),
    loadOrganizationalUnits(),
  ]);
}

// ==========================================
// CREATE / EDIT
// ==========================================

function resetForm() {
  Object.assign(form, {
    code: "",
    name: "",
    abbreviation: "",
    organizational_unit_id: "",
    salary_grade: "",
    standard_monthly_rate: "",
  });

  formError.value = "";
}

function openCreateModal() {
  if (!canManage.value) return;

  editingId.value = null;

  resetForm();

  modalOpen.value = true;
}

function openEditModal(record: MasterRecord) {
  if (!canManage.value) return;

  resetForm();

  editingId.value = record.id;

  Object.assign(form, {
    code: recordCode(record) || "",
    name: recordName(record) || "",
    abbreviation: record.abbreviation || "",
    organizational_unit_id:
      record.organizational_unit_id != null
        ? String(record.organizational_unit_id)
        : "",
    salary_grade:
      record.salary_grade != null
        ? String(record.salary_grade)
        : "",
    standard_monthly_rate:
      record.standard_monthly_rate != null
        ? String(record.standard_monthly_rate)
        : "",
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
// FORM VALIDATION
// ==========================================

function validateForm(): boolean {
  formError.value = "";

  if (!form.code.trim()) {
    formError.value = `${entity.value} code is required.`;
    return false;
  }

  if (!form.name.trim()) {
    formError.value = `${entity.value} name is required.`;
    return false;
  }

  if (isDepartment.value) {
    if (!form.organizational_unit_id) {
      formError.value =
        "Please select an organizational unit.";

      return false;
    }

    const selectedUnit = activeUnits.value.find(
      (unit) =>
        String(unit.id) === form.organizational_unit_id
    );

    if (!selectedUnit) {
      formError.value =
        "Please select an active organizational unit.";

      return false;
    }
  }

  if (!isDepartment.value && form.salary_grade !== "") {
    const grade = Number(form.salary_grade);

    if (
      !Number.isInteger(grade) ||
      grade < 1 ||
      grade > 33
    ) {
      formError.value =
        "Salary grade must be between 1 and 33.";

      return false;
    }
  }

  if (
    !isDepartment.value &&
    form.standard_monthly_rate !== ""
  ) {
    const rate = form.standard_monthly_rate.trim();

    if (!/^\d{1,13}(\.\d{1,2})?$/.test(rate)) {
      formError.value =
        "Enter a valid non-negative rate with up to two decimal places.";

      return false;
    }
  }

  return true;
}

// ==========================================
// SAVE RECORD
// ==========================================

async function saveRecord() {
  if (!canManage.value || saving.value) return;

  if (!validateForm()) return;

  saving.value = true;
  successMessage.value = "";

  const payload = isDepartment.value
    ? {
        office_code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        abbreviation:
          form.abbreviation.trim() || null,
        organizational_unit_id:
          Number(form.organizational_unit_id),
      }
    : {
        position_code: form.code.trim().toUpperCase(),
        title: form.name.trim(),
        salary_grade:
          form.salary_grade !== ""
            ? Number(form.salary_grade)
            : null,
        standard_monthly_rate:
          form.standard_monthly_rate.trim() || null,
      };

  try {
    if (editingId.value === null) {
      await api.post(endpoint.value, payload);

      successMessage.value =
        `${entity.value} created successfully.`;
    } else {
      await api.put(
        `${endpoint.value}/${editingId.value}`,
        payload
      );

      successMessage.value =
        `${entity.value} updated successfully.`;
    }

    modalOpen.value = false;
    editingId.value = null;

    resetForm();

    await loadRecords();
  } catch (err) {
    formError.value = getError(
      err,
      `Unable to save ${entity.value.toLowerCase()}.`
    );
  } finally {
    saving.value = false;
  }
}

// ==========================================
// STATUS MANAGEMENT
// ==========================================

function openStatusModal(record: MasterRecord) {
  if (!canManage.value) return;

  statusTarget.value = record;
  statusError.value = "";
  statusModalOpen.value = true;
}

function closeStatusModal() {
  if (statusSaving.value) return;

  statusModalOpen.value = false;
  statusTarget.value = null;
  statusError.value = "";
}

async function confirmStatusChange() {
  if (
    !canManage.value ||
    !statusTarget.value ||
    statusSaving.value
  ) {
    return;
  }

  statusSaving.value = true;
  statusError.value = "";
  successMessage.value = "";

  const target = statusTarget.value;
  const nextStatus = !target.is_active;

  try {
    await api.patch(
      `${endpoint.value}/${target.id}/status`,
      {
        is_active: nextStatus,
      }
    );

    successMessage.value = `${entity.value} ${
      nextStatus ? "activated" : "deactivated"
    } successfully.`;

    statusModalOpen.value = false;
    statusTarget.value = null;

    await loadRecords();
  } catch (err) {
    statusError.value = getError(
      err,
      "Unable to update record status."
    );
  } finally {
    statusSaving.value = false;
  }
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(refreshData);
</script>

<template>
  <div class="master-page">

    <!-- PAGE HEADER -->
    <header class="page-header">
      <div>
        <span class="eyebrow">MASTER DATA</span>

        <h1>{{ pageTitle }}</h1>

        <p>{{ pageDescription }}</p>
      </div>

      <button
        v-if="canManage"
        class="primary-button"
        type="button"
        @click="openCreateModal"
      >
        <Plus :size="18" />
        Add {{ entity }}
      </button>
    </header>

    <!-- SUCCESS NOTIFICATION -->
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
        <X :size="17" />
      </button>
    </div>

    <!-- STATISTICS -->
    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon green">
          <component :is="moduleIcon" :size="24" />
        </div>

        <div>
          <span>Total {{ entity }}s</span>
          <strong>{{ loading ? "—" : records.length }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon green">
          <CheckCircle2 :size="24" />
        </div>

        <div>
          <span>Active</span>
          <strong>{{ loading ? "—" : activeCount }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon gray">
          <Power :size="24" />
        </div>

        <div>
          <span>Inactive</span>
          <strong>{{ loading ? "—" : inactiveCount }}</strong>
        </div>
      </article>
    </div>

    <!-- RECORDS -->
    <section class="records-card">
      <div class="records-header">
        <div>
          <h2>{{ entity }} Directory</h2>

          <p>
            View and maintain existing {{ props.mode }}.
          </p>
        </div>

        <button
          class="secondary-button"
          type="button"
          :disabled="loading || unitsLoading"
          @click="refreshData"
        >
          <RefreshCw
            :size="16"
            :class="{ spinning: loading }"
          />

          Refresh
        </button>
      </div>

      <!-- FILTERS -->
      <div class="toolbar">
        <div class="search-field">
          <Search :size="18" />

          <input
            v-model="search"
            type="search"
            :placeholder="`Search ${props.mode}...`"
            aria-label="Search records"
          />
        </div>

        <select
          v-if="isDepartment && canManage"
          v-model="unitFilter"
          aria-label="Filter organizational unit"
        >
          <option value="">
            All Organizational Units
          </option>

          <option
            v-for="unit in organizationalUnits"
            :key="unit.id"
            :value="String(unit.id)"
          >
            {{ unit.name }}
          </option>
        </select>

        <select
          v-model="statusFilter"
          aria-label="Filter status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- ERROR -->
      <div
        v-if="error"
        class="error-message"
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
              <th>Code</th>

              <th>
                {{ isDepartment ? "Department Name" : "Position Title" }}
              </th>

              <th v-if="isDepartment">
                Organizational Unit
              </th>

              <th v-else>Salary Grade</th>

              <th v-if="!isDepartment">
                Reference Monthly Rate
              </th>

              <th>Status</th>

              <th v-if="canManage">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="table-state">
                <LoaderCircle
                  :size="25"
                  class="spinning"
                />

                <p>Loading {{ props.mode }}...</p>
              </td>
            </tr>

            <tr
              v-for="record in loading || error ? [] : filteredRecords"
              :key="record.id"
            >
              <td>
                <span class="record-code">
                  {{ recordCode(record) }}
                </span>
              </td>

              <td>
                <div class="record-name">
                  <strong>{{ recordName(record) }}</strong>

                  <small
                    v-if="isDepartment && record.abbreviation"
                  >
                    {{ record.abbreviation }}
                  </small>
                </div>
              </td>

              <td v-if="isDepartment">
                <div class="unit-cell">
                  <strong>
                    {{
                      record.organizational_unit?.name ||
                      "Unassigned"
                    }}
                  </strong>

                  <small
                    v-if="record.organizational_unit"
                  >
                    {{
                      record.organizational_unit.type ===
                      "hospital"
                        ? "Hospital"
                        : "Provincial Office"
                    }}
                  </small>
                </div>
              </td>

              <td v-else>
                {{
                  record.salary_grade
                    ? `SG ${record.salary_grade}`
                    : "Not specified"
                }}
              </td>

              <td v-if="!isDepartment">
                {{
                  formatCurrency(
                    record.standard_monthly_rate
                  )
                }}
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    record.is_active
                      ? 'active'
                      : 'inactive'
                  "
                >
                  <span class="status-dot"></span>

                  {{
                    record.is_active
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
                    @click="openEditModal(record)"
                  >
                    <Pencil :size="14" />
                    Edit
                  </button>

                  <button
                    type="button"
                    class="status-button"
                    :class="{
                      deactivate: record.is_active
                    }"
                    @click="openStatusModal(record)"
                  >
                    <Power :size="14" />

                    {{
                      record.is_active
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
                filteredRecords.length === 0
              "
            >
              <td colspan="6" class="table-state">
                <div class="empty-state">
                  <div class="empty-icon">
                    <component
                      :is="moduleIcon"
                      :size="30"
                    />
                  </div>

                  <h3>No {{ props.mode }} found</h3>

                  <p>
                    {{
                      search || statusFilter !== "all" || unitFilter
                        ? "Try changing your search or filters."
                        : `No ${props.mode} have been registered yet.`
                    }}
                  </p>

                  <button
                    v-if="
                      canManage &&
                      records.length === 0
                    "
                    class="primary-button"
                    type="button"
                    @click="openCreateModal"
                  >
                    <Plus :size="16" />
                    Add {{ entity }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="table-footer">
        Showing {{ filteredRecords.length }}
        of {{ records.length }} {{ props.mode }}
      </footer>
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
            :aria-label="modalTitle"
          >
            <header class="modal-header">
              <div>
                <span class="eyebrow">MASTER DATA</span>

                <h2>{{ modalTitle }}</h2>

                <p>
                  Complete the required information below.
                </p>
              </div>

              <button
                type="button"
                class="icon-button"
                aria-label="Close"
                :disabled="saving"
                @click="closeModal"
              >
                <X :size="20" />
              </button>
            </header>

            <form @submit.prevent="saveRecord">
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

                    <!-- ORGANIZATIONAL UNIT -->
                    <div
                      v-if="isDepartment"
                      class="form-group full-width"
                    >
                      <label for="unit-id">
                        Organizational Unit *
                      </label>

                      <select
                        id="unit-id"
                        v-model="form.organizational_unit_id"
                        :disabled="unitsLoading"
                        required
                      >
                        <option value="">
                          {{
                            unitsLoading
                              ? "Loading units..."
                              : "Select organizational unit"
                          }}
                        </option>

                        <option
                          v-for="unit in activeUnits"
                          :key="unit.id"
                          :value="String(unit.id)"
                        >
                          {{ unit.name }}
                          —
                          {{
                            unit.type === "hospital"
                              ? "Hospital"
                              : "Provincial Office"
                          }}
                        </option>
                      </select>

                      <small
                        v-if="unitError"
                        class="field-error"
                      >
                        {{ unitError }}
                      </small>

                      <small
                        v-else-if="
                          !unitsLoading &&
                          activeUnits.length === 0
                        "
                        class="field-error"
                      >
                        Create an active organizational
                        unit first in Users & Access.
                      </small>

                      <small v-else>
                        Defines the department's
                        organizational access boundary.
                      </small>
                    </div>

                    <!-- CODE -->
                    <div class="form-group">
                      <label for="record-code">
                        {{ entity }} Code *
                      </label>

                      <input
                        id="record-code"
                        v-model="form.code"
                        type="text"
                        :maxlength="isDepartment ? 30 : 50"
                        :placeholder="
                          isDepartment
                            ? 'ICT-SD'
                            : 'JO-DEV'
                        "
                        required
                      />
                    </div>

                    <!-- ABBREVIATION -->
                    <div
                      v-if="isDepartment"
                      class="form-group"
                    >
                      <label for="abbreviation">
                        Abbreviation
                      </label>

                      <input
                        id="abbreviation"
                        v-model="form.abbreviation"
                        type="text"
                        maxlength="50"
                        placeholder="SD"
                      />
                    </div>

                    <!-- SALARY GRADE -->
                    <div v-else class="form-group">
                      <label for="salary-grade">
                        Salary Grade
                      </label>

                      <select
                        id="salary-grade"
                        v-model="form.salary_grade"
                      >
                        <option value="">
                          Not applicable
                        </option>

                        <option
                          v-for="grade in 33"
                          :key="grade"
                          :value="String(grade)"
                        >
                          Salary Grade {{ grade }}
                        </option>
                      </select>
                    </div>

                    <!-- NAME -->
                    <div class="form-group full-width">
                      <label for="record-name">
                        {{
                          isDepartment
                            ? "Department Name"
                            : "Position Title"
                        }}
                        *
                      </label>

                      <input
                        id="record-name"
                        v-model="form.name"
                        type="text"
                        maxlength="255"
                        :placeholder="
                          isDepartment
                            ? 'Software Development'
                            : 'Software Developer'
                        "
                        required
                      />
                    </div>

                    <!-- STANDARD RATE -->
                    <div
                      v-if="!isDepartment"
                      class="form-group full-width"
                    >
                      <label for="monthly-rate">
                        Standard Monthly Rate (PHP)
                      </label>

                      <input
                        id="monthly-rate"
                        v-model="form.standard_monthly_rate"
                        type="text"
                        inputmode="decimal"
                        placeholder="0.00"
                        maxlength="16"
                      />

                      <small>
                        Optional reference rate.
                        Actual salary is defined in
                        the employment contract.
                      </small>
                    </div>
                  </div>
                </fieldset>

                <div class="information-note">
                  <AlertCircle :size="17" />

                  <span>
                    {{
                      isDepartment
                        ? "Departments are linked to organizational units for secure employee and payroll access."
                        : "Positions are reusable master records. Employee assignments are managed through employment contracts."
                    }}
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
                  :disabled="
                    saving ||
                    (isDepartment &&
                      (unitsLoading || activeUnits.length === 0))
                  "
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
                        ? `Create ${entity}`
                        : "Save Changes"
                  }}
                </button>
              </footer>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>

    <!-- STATUS CONFIRMATION MODAL -->
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
            aria-label="Confirm status change"
          >
            <header class="modal-header">
              <div>
                <span class="eyebrow">
                  STATUS MANAGEMENT
                </span>

                <h2>
                  {{
                    statusTarget.is_active
                      ? "Deactivate"
                      : "Activate"
                  }}
                  {{ entity }}
                </h2>
              </div>

              <button
                type="button"
                class="icon-button"
                aria-label="Close"
                :disabled="statusSaving"
                @click="closeStatusModal"
              >
                <X :size="20" />
              </button>
            </header>

            <div class="modal-body">
              <div
                v-if="statusError"
                class="error-message"
                role="alert"
              >
                <AlertCircle :size="18" />
                {{ statusError }}
              </div>

              <p class="confirmation-text">
                Are you sure you want to
                {{
                  statusTarget.is_active
                    ? "deactivate"
                    : "activate"
                }}
                <strong>
                  {{ recordName(statusTarget) }}
                </strong>?
              </p>

              <div
                v-if="statusTarget.is_active"
                class="information-note"
              >
                <AlertCircle :size="18" />

                <span>
                  Existing historical records will
                  not be deleted. Inactive records
                  should not be used for new
                  employment assignments.
                </span>
              </div>
            </div>

            <footer class="modal-footer">
              <button
                type="button"
                class="secondary-button"
                :disabled="statusSaving"
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
                :disabled="statusSaving"
                @click="confirmStatusChange"
              >
                <LoaderCircle
                  v-if="statusSaving"
                  :size="16"
                  class="spinning"
                />

                <Power v-else :size="16" />

                {{
                  statusSaving
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
.master-page {
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
  transition: background 0.2s;
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

.danger-button:hover {
  background: #963636;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 26px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: white;
  border: 1px solid #e4ebe6;
  border-radius: 14px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 12px;
}

.stat-icon.green {
  background: #e4f4e9;
  color: #087452;
}

.stat-icon.gray {
  background: #edf0ee;
  color: #7b8b81;
}

.stat-card span,
.stat-card strong {
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

/* RECORDS */

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
  max-width: 260px;
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

.record-code {
  color: #087452;
  font-weight: 700;
  white-space: nowrap;
}

.record-name {
  min-width: 140px;
}

.record-name strong,
.record-name small,
.unit-cell strong,
.unit-cell small {
  display: block;
}

.record-name small,
.unit-cell small {
  margin-top: 6px;
  color: #91a096;
  font-size: 10px;
}

.unit-cell strong {
  font-weight: 500;
}

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
  align-items: center;
  gap: 7px;
}

.edit-button,
.status-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  max-height: 92vh;
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
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #edf1ee;
  background: #fafcfb;
}

/* FORMS */

fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: #365344;
  font-size: 12px;
  font-weight: 700;
}

.form-group input,
.form-group select {
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

.form-group input:focus,
.form-group select:focus {
  border-color: #087452;
  box-shadow: 0 0 0 3px #08745212;
}

.form-group small {
  color: #91a096;
  font-size: 11px;
  line-height: 1.6;
}

.form-group .field-error {
  color: #b34343;
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

@media (max-width: 1000px) {
  .master-page {
    padding: 24px;
  }

  .stats-grid {
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }
}

@media (max-width: 700px) {
  .master-page {
    padding: 18px;
  }

  .page-header {
    flex-direction: column;
  }

  .stats-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
  }

  .toolbar select {
    max-width: none;
  }

  .modal-backdrop {
    padding: 12px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
}
</style>
