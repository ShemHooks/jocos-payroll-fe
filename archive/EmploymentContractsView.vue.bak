
<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  reactive,
  ref,
  watch,
} from "vue";

import {
  FileText,
  Files,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
  History,
  X,
  Save,
  AlertCircle,
  LoaderCircle,
  Power,
} from "lucide-vue-next";

import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

import {
  employmentContractService as contractService,
} from "../services/employment-contract.service";

import type {
  EmploymentContract,
  EmploymentContractPayload,
  ContractEmployee,
  ContractDepartment,
  ContractPosition,
} from "../types/employment-contract";

const auth = useAuthStore();

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

  return (
    roles.size === 1 &&
    roles.has("ADMIN") &&
    auth.can("contracts.manage")
  );
});

// ==========================================
// STATE
// ==========================================

const contracts = ref<EmploymentContract[]>([]);
const employees = ref<ContractEmployee[]>([]);
const departments = ref<ContractDepartment[]>([]);
const positions = ref<ContractPosition[]>([]);

const loading = ref(false);
const saving = ref(false);
const loadingOptions = ref(false);
const loadingEmployees = ref(false);

const error = ref("");
const formError = ref("");
const successMessage = ref("");

const search = ref("");
const employeeSearch = ref("");
const departmentFilter = ref("");
const statusFilter = ref("");

const page = ref(1);
const pageSize = 20;
const total = ref(0);
const totalPages = ref(0);

const stats = reactive({
  total: 0,
  active: 0,
  expiring: 0,
  expired: 0,
});

const statsError = ref("");

const modalOpen = ref(false);
const detailsOpen = ref(false);
const historyOpen = ref(false);
const statusModalOpen = ref(false);

const editingId = ref<number | null>(null);
const selectedContract =
  ref<EmploymentContract | null>(null);

const statusTarget =
  ref<EmploymentContract | null>(null);

const selectedEmployee =
  ref<ContractEmployee | null>(null);

const historyRecords =
  ref<EmploymentContract[]>([]);

const historyEmployee =
  ref<ContractEmployee | null>(null);

const historyLoading = ref(false);
const historyError = ref("");
const historyPage = ref(1);
const historyTotalPages = ref(0);

let listRequestId = 0;
let employeeRequestId = 0;
let historyRequestId = 0;
let statsRequestId = 0;
let searchTimer: ReturnType<typeof setTimeout>;
let employeeTimer: ReturnType<typeof setTimeout>;

const form = reactive({
  employee_id: 0,
  department_id: 0,
  position_id: 0,
  employment_type: "jo",
  salary_rate: "",
  salary_period: "monthly",
  start_date: "",
  end_date: "",
});

// ==========================================
// HELPERS
// ==========================================

function employeeName(employee: ContractEmployee) {
  return [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
    employee.name_extension,
  ].filter(Boolean).join(" ");
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "No expiration";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatStatus(value: string) {
  return value.charAt(0).toUpperCase() +
    value.slice(1);
}

function businessDate() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getError(err: unknown, fallback: string) {
  const detail = (
    err as {
      response?: {
        data?: { detail?: unknown };
      };
    }
  )?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) =>
      `${item.loc?.at(-1) || "Field"}: ${item.msg}`
    ).join(". ");
  }

  return fallback;
}

// ==========================================
// LOAD CONTRACTS
// ==========================================

async function loadContracts() {
  const requestId = ++listRequestId;

  loading.value = true;
  error.value = "";

  try {
    const response = await contractService.list({
      page: page.value,
      page_size: pageSize,
      search: search.value.trim() || undefined,
      department_id: departmentFilter.value
        ? Number(departmentFilter.value)
        : undefined,
      contract_status:
        statusFilter.value || undefined,
    });

    if (requestId !== listRequestId) return;

    if (
      page.value > 1 &&
      page.value > response.total_pages
    ) {
      page.value = Math.max(
        1,
        response.total_pages
      );

      await loadContracts();
      return;
    }

    contracts.value = response.items;
    total.value = response.total;
    totalPages.value = response.total_pages;

  } catch (err) {
    if (requestId !== listRequestId) return;

    error.value = getError(
      err,
      "Unable to load employment contracts."
    );

    contracts.value = [];

  } finally {
    if (requestId === listRequestId) {
      loading.value = false;
    }
  }
}

// ==========================================
// STATISTICS
// ==========================================

async function loadStatistics() {
  const requestId = ++statsRequestId;

  statsError.value = "";

  try {
    const [
      all,
      active,
      expiring,
      expired,
    ] = await Promise.all([
      contractService.list({
        page_size: 1,
      }),
      contractService.list({
        page_size: 1,
        contract_status: "active",
      }),
      contractService.list({
        page_size: 1,
        contract_status: "expiring_soon",
      }),
      contractService.list({
        page_size: 1,
        contract_status: "expired",
      }),
    ]);

    if (requestId !== statsRequestId) return;

    Object.assign(stats, {
      total: all.total,
      active: active.total,
      expiring: expiring.total,
      expired: expired.total,
    });

  } catch {
    if (requestId === statsRequestId) {
      statsError.value =
        "Unable to refresh contract statistics.";
    }
  }
}

async function refreshPage() {
  await Promise.all([
    loadContracts(),
    loadStatistics(),
  ]);
}

// ==========================================
// MASTER DATA
// ==========================================

const activeDepartments = computed(() =>
  departments.value.filter(
    (department) =>
      department.is_active &&
      department.organizational_unit?.is_active
  )
);

const activePositions = computed(() =>
  positions.value.filter(
    (position) => position.is_active
  )
);

async function loadOptions() {
  loadingOptions.value = true;

  try {
    const requests = [
      api.get("/departments"),
    ];

    if (canManage.value) {
      requests.push(
        api.get("/positions")
      );
    }

    const responses = await Promise.all(requests);

    departments.value = responses[0]!.data;

    if (canManage.value) {
      positions.value = responses[1]!.data;
    }

  } catch (err) {
    formError.value = getError(
      err,
      "Unable to load master data."
    );

  } finally {
    loadingOptions.value = false;
  }
}

// ==========================================
// EMPLOYEE SEARCH
// ==========================================

async function loadEmployees() {
  if (!canManage.value) return;

  const requestId = ++employeeRequestId;

  loadingEmployees.value = true;

  try {
    const response = await api.get(
      "/employees",
      {
        params: {
          page: 1,
          page_size: 20,
          search:
            employeeSearch.value.trim() ||
            undefined,
        },
      }
    );

    if (requestId !== employeeRequestId) return;

    employees.value = response.data.items;

  } catch (err) {
    if (requestId !== employeeRequestId) return;

    formError.value = getError(
      err,
      "Unable to search employees."
    );

  } finally {
    if (requestId === employeeRequestId) {
      loadingEmployees.value = false;
    }
  }
}

function selectEmployee(employee: ContractEmployee) {
  selectedEmployee.value = employee;
  form.employee_id = employee.id;
}

function clearEmployee() {
  selectedEmployee.value = null;
  form.employee_id = 0;
  employeeSearch.value = "";

  void loadEmployees();
}

// ==========================================
// FILTERS AND PAGINATION
// ==========================================

watch(search, () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    page.value = 1;
    void loadContracts();
  }, 350);
});

watch(
  [departmentFilter, statusFilter],
  () => {
    page.value = 1;
    void loadContracts();
  }
);

watch(employeeSearch, () => {
  clearTimeout(employeeTimer);

  employeeTimer = setTimeout(() => {
    if (modalOpen.value) {
      void loadEmployees();
    }
  }, 350);
});

function changePage(nextPage: number) {
  if (
    nextPage < 1 ||
    nextPage > totalPages.value
  ) return;

  page.value = nextPage;

  void loadContracts();
}

// ==========================================
// CONTRACT FORM
// ==========================================

function resetForm() {
  Object.assign(form, {
    employee_id: 0,
    department_id: 0,
    position_id: 0,
    employment_type: "jo",
    salary_rate: "",
    salary_period: "monthly",
    start_date: "",
    end_date: "",
  });

  selectedEmployee.value = null;
  employeeSearch.value = "";
  editingId.value = null;
  formError.value = "";
}

async function openCreateModal() {
  if (!canManage.value) return;

  resetForm();
  modalOpen.value = true;

  await Promise.all([
    loadOptions(),
    loadEmployees(),
  ]);
}

async function openEditModal(
  contract: EmploymentContract
) {
  if (
    !canManage.value ||
    contract.effective_status !== "upcoming"
  ) return;

  resetForm();

  editingId.value = contract.id;

  selectedEmployee.value = contract.employee;

  Object.assign(form, {
    employee_id: contract.employee_id,
    department_id: contract.department_id,
    position_id: contract.position_id,
    employment_type: contract.employment_type,
    salary_rate: String(contract.salary_rate),
    salary_period: contract.salary_period,
    start_date: contract.start_date,
    end_date: contract.end_date || "",
  });

  modalOpen.value = true;

  await loadOptions();
}

async function openRenewalModal(
  contract: EmploymentContract
) {
  if (
    !canManage.value ||
    !contract.end_date ||
    contract.status !== "active"
  ) return;

  resetForm();

  detailsOpen.value = false;
  selectedEmployee.value = contract.employee;

  Object.assign(form, {
    employee_id: contract.employee_id,
    department_id: contract.department_id,
    position_id: contract.position_id,
    employment_type: contract.employment_type,
    salary_rate: String(contract.salary_rate),
    salary_period: contract.salary_period,
    start_date: nextDate(contract.end_date),
    end_date: "",
  });

  modalOpen.value = true;

  await loadOptions();
}

function closeModal() {
  if (saving.value) return;

  modalOpen.value = false;
  resetForm();
}

function applyPositionRate() {
  const position = positions.value.find(
    (item) => item.id === form.position_id
  );

  if (
    !form.salary_rate &&
    form.salary_period === "monthly" &&
    position?.standard_monthly_rate != null
  ) {
    form.salary_rate = String(
      position.standard_monthly_rate
    );
  }
}

// ==========================================
// FORM VALIDATION
// ==========================================

function validateForm(): boolean {
  formError.value = "";

  if (!form.employee_id) {
    formError.value = "Select an employee.";
    return false;
  }

  if (
    !activeDepartments.value.some(
      (item) => item.id === form.department_id
    )
  ) {
    formError.value =
      "Select an active department with an active organizational unit.";

    return false;
  }

  if (
    !activePositions.value.some(
      (item) => item.id === form.position_id
    )
  ) {
    formError.value =
      "Select an active position.";

    return false;
  }

  if (
    !form.employment_type.trim() ||
    form.employment_type.trim().length > 30
  ) {
    formError.value =
      "Enter a valid employment type.";

    return false;
  }

  if (
    !/^\d{1,13}(\.\d{1,2})?$/.test(
      form.salary_rate
    ) ||
    Number(form.salary_rate) <= 0
  ) {
    formError.value =
      "Enter a valid salary rate greater than zero.";

    return false;
  }

  if (
    !form.salary_period.trim() ||
    form.salary_period.trim().length > 20
  ) {
    formError.value =
      "Enter a valid salary period.";

    return false;
  }

  if (!form.start_date) {
    formError.value =
      "Contract start date is required.";

    return false;
  }

  if (
    form.end_date &&
    form.end_date < form.start_date
  ) {
    formError.value =
      "End date cannot be earlier than start date.";

    return false;
  }

  if (
    editingId.value !== null &&
    form.start_date <= businessDate()
  ) {
    formError.value =
      "An upcoming contract must retain a future start date.";

    return false;
  }

  return true;
}

// ==========================================
// SAVE CONTRACT
// ==========================================

async function saveContract() {
  if (
    !canManage.value ||
    saving.value ||
    loadingOptions.value ||
    !validateForm()
  ) return;

  saving.value = true;
  successMessage.value = "";

  const payload: EmploymentContractPayload = {
    employee_id: form.employee_id,
    department_id: form.department_id,
    position_id: form.position_id,
    employment_type:
      form.employment_type.trim().toLowerCase(),
    salary_rate: form.salary_rate,
    salary_period:
      form.salary_period.trim().toLowerCase(),
    start_date: form.start_date,
    end_date: form.end_date || null,
  };

  try {
    if (editingId.value === null) {
      await contractService.create(payload);

      successMessage.value =
        "Employment contract created successfully.";

    } else {
      await contractService.update(
        editingId.value,
        payload
      );

      successMessage.value =
        "Employment contract updated successfully.";
    }

    modalOpen.value = false;
    resetForm();

    await refreshPage();

  } catch (err) {
    formError.value = getError(
      err,
      "Unable to save employment contract."
    );

  } finally {
    saving.value = false;
  }
}

// ==========================================
// CONTRACT DETAILS
// ==========================================

function openDetails(
  contract: EmploymentContract
) {
  selectedContract.value = contract;
  detailsOpen.value = true;
}

// ==========================================
// CONTRACT STATUS
// ==========================================

function canChangeStatus(
  contract: EmploymentContract
) {
  return (
    canManage.value &&
    contract.start_date > businessDate() &&
    ["active", "cancelled"].includes(
      contract.status
    )
  );
}

function openStatusModal(
  contract: EmploymentContract
) {
  if (!canChangeStatus(contract)) return;

  statusTarget.value = contract;
  formError.value = "";
  statusModalOpen.value = true;
}

async function updateStatus() {
  if (
    !statusTarget.value ||
    !canChangeStatus(statusTarget.value) ||
    saving.value
  ) return;

  saving.value = true;
  formError.value = "";

  const nextStatus =
    statusTarget.value.status === "cancelled"
      ? "active"
      : "cancelled";

  try {
    await contractService.updateStatus(
      statusTarget.value.id,
      nextStatus
    );

    successMessage.value =
      nextStatus === "active"
        ? "Contract reactivated successfully."
        : "Contract cancelled successfully.";

    statusModalOpen.value = false;
    statusTarget.value = null;
    detailsOpen.value = false;

    await refreshPage();

  } catch (err) {
    formError.value = getError(
      err,
      "Unable to update contract status."
    );

  } finally {
    saving.value = false;
  }
}

// ==========================================
// EMPLOYMENT HISTORY
// ==========================================

async function loadHistory() {
  if (!historyEmployee.value) return;

  const requestId = ++historyRequestId;

  historyLoading.value = true;
  historyError.value = "";

  try {
    const response = await contractService.history(
      historyEmployee.value.id,
      historyPage.value
    );

    if (requestId !== historyRequestId) return;

    historyRecords.value = response.items;
    historyTotalPages.value = response.total_pages;

  } catch (err) {
    if (requestId !== historyRequestId) return;

    historyError.value = getError(
      err,
      "Unable to load employment history."
    );

  } finally {
    if (requestId === historyRequestId) {
      historyLoading.value = false;
    }
  }
}

async function openHistory(
  employee: ContractEmployee
) {
  historyEmployee.value = employee;
  historyRecords.value = [];
  historyPage.value = 1;
  historyTotalPages.value = 0;
  historyOpen.value = true;

  await loadHistory();
}

function changeHistoryPage(nextPage: number) {
  if (
    nextPage < 1 ||
    nextPage > historyTotalPages.value
  ) return;

  historyPage.value = nextPage;

  void loadHistory();
}

onMounted(async () => {
  await Promise.all([
    refreshPage(),
    loadOptions(),
  ]);
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  clearTimeout(employeeTimer);

  listRequestId++;
  employeeRequestId++;
  historyRequestId++;
  statsRequestId++;
});
</script>

<template>
  <div class="contracts-page">

    <!-- HEADER -->
    <header class="page-header">
      <div>
        <span class="eyebrow">
          PERSONNEL MANAGEMENT
        </span>

        <h1>Employment Contracts</h1>

        <p>
          Manage employee assignments,
          compensation and employment agreements.
        </p>
      </div>

      <button
        v-if="canManage"
        class="primary-button"
        @click="openCreateModal"
      >
        <Plus :size="18" />
        Add Contract
      </button>
    </header>

    <!-- SUCCESS -->
    <div
      v-if="successMessage"
      class="success-message"
      role="status"
    >
      <CheckCircle2 :size="19" />
      <span>{{ successMessage }}</span>

      <button
        class="icon-button"
        aria-label="Dismiss notification"
        @click="successMessage = ''"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- STATISTICS -->
    <div
      v-if="statsError"
      class="error-message"
    >
      <AlertCircle :size="17" />
      {{ statsError }}
    </div>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon green">
          <Files :size="24" />
        </div>

        <div>
          <span>Total Contracts</span>
          <strong>{{ statsError ? "—" : stats.total }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon green">
          <CheckCircle2 :size="24" />
        </div>

        <div>
          <span>Active Contracts</span>
          <strong>{{ statsError ? "—" : stats.active }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon amber">
          <Clock :size="24" />
        </div>

        <div>
          <span>Expiring Soon</span>
          <strong>{{ statsError ? "—" : stats.expiring }}</strong>
          <small>Within 30 days</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon red">
          <CalendarX :size="24" />
        </div>

        <div>
          <span>Expired Contracts</span>
          <strong>{{ statsError ? "—" : stats.expired }}</strong>
        </div>
      </article>
    </section>

    <!-- CONTRACT DIRECTORY -->
    <section class="records-card">
      <header class="records-header">
        <div>
          <h2>Employment Contract Directory</h2>

          <p>
            View and maintain employee contracts.
          </p>
        </div>

        <button
          class="secondary-button"
          :disabled="loading"
          @click="refreshPage"
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
            placeholder="Search employee, department or position..."
            aria-label="Search contracts"
          />
        </div>

        <select
          v-model="departmentFilter"
          aria-label="Filter by department"
        >
          <option value="">
            All Departments
          </option>

          <option
            v-for="department in departments"
            :key="department.id"
            :value="String(department.id)"
          >
            {{ department.name }}
          </option>
        </select>

        <select
          v-model="statusFilter"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="expiring_soon">
            Expiring Soon
          </option>
          <option value="expired">Expired</option>
          <option value="cancelled">
            Cancelled
          </option>
        </select>
      </div>

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
              <th>Employee</th>
              <th>Department / Position</th>
              <th>Type</th>
              <th>Salary Rate</th>
              <th>Contract Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="table-state">
                <LoaderCircle
                  :size="28"
                  class="spinning"
                />
                <p>Loading employment contracts...</p>
              </td>
            </tr>

            <tr
              v-for="contract in loading || error
                ? []
                : contracts"
              :key="contract.id"
            >
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar">
                    {{ contract.employee.first_name[0] }}
                    {{ contract.employee.last_name[0] }}
                  </div>

                  <div>
                    <strong>
                      {{ employeeName(contract.employee) }}
                    </strong>

                    <small>
                      {{ contract.employee.employee_no }}
                    </small>
                  </div>
                </div>
              </td>

              <td>
                <strong>
                  {{ contract.department.name }}
                </strong>

                <small>
                  {{ contract.position.title }}
                </small>
              </td>

              <td>
                <span class="type-badge">
                  {{ contract.employment_type.toUpperCase() }}
                </span>
              </td>

              <td>
                <strong class="salary">
                  {{ formatCurrency(contract.salary_rate) }}
                </strong>

                <small>
                  {{ formatStatus(contract.salary_period) }}
                </small>
              </td>

              <td>
                <span>
                  {{ formatDate(contract.start_date) }}
                </span>

                <small>
                  {{ formatDate(contract.end_date) }}
                </small>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="contract.effective_status"
                >
                  <span class="status-dot"></span>

                  {{
                    formatStatus(
                      contract.effective_status
                    )
                  }}
                </span>
              </td>

              <td>
                <div class="table-actions">
                  <button
                    class="icon-button"
                    title="View contract"
                    aria-label="View contract"
                    @click="openDetails(contract)"
                  >
                    <Eye :size="16" />
                  </button>

                  <button
                    class="icon-button"
                    title="Employment history"
                    aria-label="Employment history"
                    @click="openHistory(contract.employee)"
                  >
                    <History :size="16" />
                  </button>

                  <button
                    v-if="
                      canManage &&
                      contract.effective_status === 'upcoming'
                    "
                    class="icon-button"
                    title="Edit contract"
                    aria-label="Edit contract"
                    @click="openEditModal(contract)"
                  >
                    <Pencil :size="15" />
                  </button>

                  <button
                    v-if="canChangeStatus(contract)"
                    class="icon-button"
                    :title="
                      contract.status === 'cancelled'
                        ? 'Reactivate contract'
                        : 'Cancel contract'
                    "
                    :aria-label="
                      contract.status === 'cancelled'
                        ? 'Reactivate contract'
                        : 'Cancel contract'
                    "
                    @click="openStatusModal(contract)"
                  >
                    <Power :size="15" />
                  </button>
                </div>
              </td>
            </tr>

            <tr
              v-if="
                !loading &&
                !error &&
                contracts.length === 0
              "
            >
              <td colspan="7" class="table-state">
                <FileText :size="40" />

                <h3>No employment contracts found</h3>

                <p>
                  Create a contract or change
                  your search filters.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <footer class="table-footer">
        <span>
          Showing
          {{ total ? (page - 1) * pageSize + 1 : 0 }}
          –
          {{ Math.min(page * pageSize, total) }}
          of {{ total }} contracts
        </span>

        <div class="pagination">
          <button
            class="icon-button"
            aria-label="Previous page"
            :disabled="page <= 1 || loading"
            @click="changePage(page - 1)"
          >
            <ChevronLeft :size="17" />
          </button>

          <span>
            {{ page }} / {{ Math.max(1, totalPages) }}
          </span>

          <button
            class="icon-button"
            aria-label="Next page"
            :disabled="page >= totalPages || loading"
            @click="changePage(page + 1)"
          >
            <ChevronRight :size="17" />
          </button>
        </div>
      </footer>
    </section>

    <!-- CREATE / EDIT CONTRACT -->
    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="modal-backdrop"
        @click.self="closeModal"
      >
        <section
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contract-form-title"
        >
          <header class="modal-header">
            <div>
              <span class="eyebrow">
                EMPLOYMENT CONTRACT
              </span>

              <h2 id="contract-form-title">
                {{
                  editingId === null
                    ? "Create Employment Contract"
                    : "Edit Employment Contract"
                }}
              </h2>

              <p>
                Complete the employment agreement details.
              </p>
            </div>

            <button
              class="icon-button"
              aria-label="Close form"
              :disabled="saving"
              @click="closeModal"
            >
              <X :size="20" />
            </button>
          </header>

          <form @submit.prevent="saveContract">
            <div class="modal-body">
              <div
                v-if="formError"
                class="error-message"
                role="alert"
              >
                <AlertCircle :size="18" />
                {{ formError }}
              </div>

              <fieldset :disabled="saving || loadingOptions">

                <!-- EMPLOYEE SELECTION -->
                <div class="form-section">
                  <h3>Employee Information</h3>

                  <div
                    v-if="selectedEmployee"
                    class="selected-employee"
                  >
                    <div class="employee-avatar">
                      {{ selectedEmployee.first_name[0] }}
                      {{ selectedEmployee.last_name[0] }}
                    </div>

                    <div class="selected-employee-name">
                      <strong>
                        {{ employeeName(selectedEmployee) }}
                      </strong>

                      <small>
                        {{ selectedEmployee.employee_no }}
                      </small>
                    </div>

                    <button
                      v-if="editingId === null"
                      type="button"
                      class="icon-button"
                      aria-label="Clear selected employee"
                      @click="clearEmployee"
                    >
                      <X :size="16" />
                    </button>
                  </div>

                  <template v-else>
                    <div class="search-field">
                      <Search :size="17" />

                      <input
                        v-model="employeeSearch"
                        placeholder="Search employee name or number..."
                        aria-label="Search employees"
                      />
                    </div>

                    <div class="employee-options">
                      <div
                        v-if="loadingEmployees"
                        class="option-state"
                      >
                        Searching employees...
                      </div>

                      <button
                        v-for="employee in loadingEmployees
                          ? []
                          : employees"
                        :key="employee.id"
                        type="button"
                        class="employee-option"
                        @click="selectEmployee(employee)"
                      >
                        <strong>
                          {{ employeeName(employee) }}
                        </strong>

                        <small>
                          {{ employee.employee_no }}
                        </small>
                      </button>

                      <div
                        v-if="
                          !loadingEmployees &&
                          employees.length === 0
                        "
                        class="option-state"
                      >
                        No employees found.
                      </div>
                    </div>
                  </template>
                </div>

                <!-- ASSIGNMENT -->
                <div class="form-section">
                  <h3>Employment Assignment</h3>

                  <div class="form-grid">
                    <div class="form-group full-width">
                      <label for="department">
                        Department *
                      </label>

                      <select
                        id="department"
                        v-model.number="form.department_id"
                        required
                      >
                        <option :value="0" disabled>
                          Select department
                        </option>

                        <option
                          v-for="department in activeDepartments"
                          :key="department.id"
                          :value="department.id"
                        >
                          {{ department.office_code }}
                          — {{ department.name }}
                        </option>
                      </select>
                    </div>

                    <div class="form-group full-width">
                      <label for="position">
                        Position *
                      </label>

                      <select
                        id="position"
                        v-model.number="form.position_id"
                        required
                        @change="applyPositionRate"
                      >
                        <option :value="0" disabled>
                          Select position
                        </option>

                        <option
                          v-for="position in activePositions"
                          :key="position.id"
                          :value="position.id"
                        >
                          {{ position.title }}
                        </option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="employment-type">
                        Employment Type *
                      </label>

                      <input
                        id="employment-type"
                        v-model="form.employment_type"
                        list="employment-types"
                        maxlength="30"
                        required
                      />

                      <datalist id="employment-types">
                        <option value="jo" />
                        <option value="cos" />
                      </datalist>
                    </div>

                    <div class="form-group">
                      <label for="salary-period">
                        Salary Period *
                      </label>

                      <input
                        id="salary-period"
                        v-model="form.salary_period"
                        list="salary-periods"
                        maxlength="20"
                        required
                      />

                      <datalist id="salary-periods">
                        <option value="monthly" />
                        <option value="daily" />
                        <option value="hourly" />
                      </datalist>
                    </div>

                    <div class="form-group full-width">
                      <label for="salary-rate">
                        Contracted Salary Rate (PHP) *
                      </label>

                      <input
                        id="salary-rate"
                        v-model="form.salary_rate"
                        type="text"
                        inputmode="decimal"
                        placeholder="0.00"
                        required
                      />

                      <small>
                        Actual agreed compensation
                        for the selected salary period.
                      </small>
                    </div>
                  </div>
                </div>

                <!-- CONTRACT DURATION -->
                <div class="form-section">
                  <h3>Contract Duration</h3>

                  <div class="form-grid">
                    <div class="form-group">
                      <label for="start-date">
                        Start Date *
                      </label>

                      <input
                        id="start-date"
                        v-model="form.start_date"
                        type="date"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label for="end-date">
                        End Date
                      </label>

                      <input
                        id="end-date"
                        v-model="form.end_date"
                        type="date"
                        :min="form.start_date || undefined"
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              <div class="information-note">
                <AlertCircle :size="18" />

                <span>
                  Employment contracts determine
                  employee assignments and compensation.
                  Verify all information before saving.
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
                :disabled="saving || loadingOptions"
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
                      ? "Create Contract"
                      : "Save Changes"
                }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Teleport>

    <!-- CONTRACT DETAILS -->
    <Teleport to="body">
      <div
        v-if="detailsOpen && selectedContract"
        class="modal-backdrop"
        @click.self="detailsOpen = false"
      >
        <section
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contract-details-title"
        >
          <header class="modal-header">
            <div>
              <span class="eyebrow">
                CONTRACT #{{ selectedContract.id }}
              </span>

              <h2 id="contract-details-title">
                Employment Contract Details
              </h2>
            </div>

            <button
              class="icon-button"
              aria-label="Close details"
              @click="detailsOpen = false"
            >
              <X :size="20" />
            </button>
          </header>

          <div class="modal-body">
            <div class="detail-profile">
              <div class="employee-avatar large">
                {{ selectedContract.employee.first_name[0] }}
                {{ selectedContract.employee.last_name[0] }}
              </div>

              <div>
                <h3>
                  {{ employeeName(selectedContract.employee) }}
                </h3>

                <p>
                  {{ selectedContract.employee.employee_no }}
                </p>

                <span
                  class="status-badge"
                  :class="selectedContract.effective_status"
                >
                  {{
                    formatStatus(
                      selectedContract.effective_status
                    )
                  }}
                </span>
              </div>
            </div>

            <div class="details-grid">
              <div>
                <label>Organizational Unit</label>

                <strong>
                  {{
                    selectedContract.department
                      .organizational_unit?.name ||
                    "Unassigned"
                  }}
                </strong>
              </div>

              <div>
                <label>Department</label>
                <strong>
                  {{ selectedContract.department.name }}
                </strong>
              </div>

              <div>
                <label>Position</label>
                <strong>
                  {{ selectedContract.position.title }}
                </strong>
              </div>

              <div>
                <label>Employment Type</label>
                <strong>
                  {{ selectedContract.employment_type.toUpperCase() }}
                </strong>
              </div>

              <div>
                <label>Salary Rate</label>
                <strong class="salary">
                  {{ formatCurrency(selectedContract.salary_rate) }}
                </strong>
              </div>

              <div>
                <label>Salary Period</label>
                <strong>
                  {{ formatStatus(selectedContract.salary_period) }}
                </strong>
              </div>

              <div>
                <label>Start Date</label>
                <strong>
                  {{ formatDate(selectedContract.start_date) }}
                </strong>
              </div>

              <div>
                <label>End Date</label>
                <strong>
                  {{ formatDate(selectedContract.end_date) }}
                </strong>
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <button
              class="secondary-button"
              @click="detailsOpen = false"
            >
              Close
            </button>

            <button
              v-if="
                canManage &&
                selectedContract.end_date &&
                selectedContract.status === 'active'
              "
              class="primary-button"
              @click="openRenewalModal(selectedContract)"
            >
              <RefreshCw :size="16" />
              Renew Contract
            </button>
          </footer>
        </section>
      </div>
    </Teleport>

    <!-- EMPLOYMENT HISTORY -->
    <Teleport to="body">
      <div
        v-if="historyOpen && historyEmployee"
        class="modal-backdrop"
        @click.self="historyOpen = false"
      >
        <section
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-title"
        >
          <header class="modal-header">
            <div>
              <span class="eyebrow">
                EMPLOYEE RECORDS
              </span>

              <h2 id="history-title">
                Employment History
              </h2>

              <p>
                {{ employeeName(historyEmployee) }}
                — {{ historyEmployee.employee_no }}
              </p>
            </div>

            <button
              class="icon-button"
              aria-label="Close history"
              @click="historyOpen = false"
            >
              <X :size="20" />
            </button>
          </header>

          <div class="modal-body">
            <div
              v-if="historyError"
              class="error-message"
            >
              {{ historyError }}
            </div>

            <div
              v-if="historyLoading"
              class="table-state"
            >
              <LoaderCircle
                :size="25"
                class="spinning"
              />

              <p>Loading employment history...</p>
            </div>

            <div
              v-else-if="
                !historyError &&
                historyRecords.length === 0
              "
              class="table-state"
            >
              No employment history found.
            </div>

            <div
              v-for="contract in historyLoading || historyError
                ? []
                : historyRecords"
              :key="contract.id"
              class="history-card"
            >
              <div class="history-header">
                <div>
                  <strong>
                    {{ contract.position.title }}
                  </strong>

                  <small>
                    {{ contract.department.name }}
                  </small>
                </div>

                <span
                  class="status-badge"
                  :class="contract.effective_status"
                >
                  {{
                    formatStatus(
                      contract.effective_status
                    )
                  }}
                </span>
              </div>

              <div class="history-meta">
                <span>
                  {{ formatDate(contract.start_date) }}
                  —
                  {{ formatDate(contract.end_date) }}
                </span>

                <strong class="salary">
                  {{ formatCurrency(contract.salary_rate) }}
                  / {{ contract.salary_period }}
                </strong>
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <div class="pagination">
              <button
                class="icon-button"
                aria-label="Previous history page"
                :disabled="historyPage <= 1 || historyLoading"
                @click="changeHistoryPage(historyPage - 1)"
              >
                <ChevronLeft :size="17" />
              </button>

              <span>
                {{ historyPage }} /
                {{ Math.max(1, historyTotalPages) }}
              </span>

              <button
                class="icon-button"
                aria-label="Next history page"
                :disabled="
                  historyPage >= historyTotalPages ||
                  historyLoading
                "
                @click="changeHistoryPage(historyPage + 1)"
              >
                <ChevronRight :size="17" />
              </button>
            </div>

            <button
              class="secondary-button"
              @click="historyOpen = false"
            >
              Close
            </button>
          </footer>
        </section>
      </div>
    </Teleport>

    <!-- STATUS CONFIRMATION -->
    <Teleport to="body">
      <div
        v-if="statusModalOpen && statusTarget"
        class="modal-backdrop"
      >
        <section
          class="modal confirmation-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-title"
        >
          <header class="modal-header">
            <h2 id="status-title">
              {{
                statusTarget.status === "cancelled"
                  ? "Reactivate Contract"
                  : "Cancel Contract"
              }}
            </h2>

            <button
              class="icon-button"
              aria-label="Close confirmation"
              :disabled="saving"
              @click="statusModalOpen = false"
            >
              <X :size="20" />
            </button>
          </header>

          <div class="modal-body">
            <div
              v-if="formError"
              class="error-message"
            >
              {{ formError }}
            </div>

            <p>
              Are you sure you want to
              {{
                statusTarget.status === "cancelled"
                  ? "reactivate"
                  : "cancel"
              }}
              the upcoming contract of

              <strong>
                {{ employeeName(statusTarget.employee) }}
              </strong>?
            </p>
          </div>

          <footer class="modal-footer">
            <button
              class="secondary-button"
              :disabled="saving"
              @click="statusModalOpen = false"
            >
              Go Back
            </button>

            <button
              :class="
                statusTarget.status === 'cancelled'
                  ? 'primary-button'
                  : 'danger-button'
              "
              :disabled="saving"
              @click="updateStatus"
            >
              {{
                saving
                  ? "Updating..."
                  : "Confirm"
              }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.contracts-page {
  min-height: calc(100vh - 76px);
  padding: 32px;
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
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  color: #087452;
}

h1 {
  margin: 10px 0 8px;
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
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 9px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
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

.danger-button {
  background: #b34343;
  border: 1px solid #b34343;
  color: white;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  flex-shrink: 0;
  border: 1px solid #dfe8e1;
  border-radius: 7px;
  background: white;
  color: #526b5a;
  cursor: pointer;
}

.icon-button:hover:not(:disabled) {
  background: #edf6ef;
  color: #087452;
}

/* STATISTICS */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 26px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 22px;
  background: white;
  border: 1px solid #e4ebe6;
  border-radius: 13px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 11px;
}

.stat-icon.green {
  background: #e4f4e9;
  color: #087452;
}

.stat-icon.amber {
  background: #fff4df;
  color: #b78021;
}

.stat-icon.red {
  background: #fbe9e9;
  color: #b34343;
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
  margin-top: 6px;
  font-size: 27px;
}

.stat-card small {
  margin-top: 3px;
  color: #91a096;
  font-size: 10px;
}

/* DIRECTORY */

.records-card {
  background: white;
  border: 1px solid #e4ebe6;
  border-radius: 13px;
  overflow: hidden;
}

.records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  min-width: 180px;
  padding: 0 13px;
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
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 12px;
}

.toolbar select {
  max-width: 260px;
  padding: 11px 13px;
  border: 1px solid #dce7df;
  border-radius: 9px;
  background: white;
  color: #526b5a;
  font: inherit;
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
  padding: 15px 17px;
  background: #f7faf8;
  color: #83968a;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  white-space: nowrap;
}

td {
  padding: 17px;
  border-top: 1px solid #edf1ee;
  font-size: 12px;
}

td strong {
  font-size: 12px;
}

td small,
.employee-cell small,
.history-card small {
  display: block;
  margin-top: 5px;
  color: #83948a;
  font-size: 10px;
}

tbody tr:hover {
  background: #fbfdfb;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.employee-avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #e5f3e9;
  color: #087452;
  font-size: 12px;
  font-weight: 800;
}

.employee-avatar.large {
  width: 65px;
  height: 65px;
  font-size: 21px;
  border-radius: 15px;
}

.salary {
  color: #087452;
  white-space: nowrap;
}

.type-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.type-badge {
  background: #eef4ef;
  color: #526b5a;
}

.status-badge.active {
  background: #e5f4e9;
  color: #087452;
}

.status-badge.upcoming {
  background: #e8f0fa;
  color: #386ca3;
}

.status-badge.expired {
  background: #fff0dc;
  color: #a66c18;
}

.status-badge.cancelled {
  background: #fbe9e9;
  color: #b34343;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.table-actions {
  display: flex;
  gap: 5px;
}

.table-state {
  padding: 45px;
  text-align: center;
  color: #91a096;
}

.table-state h3 {
  color: #365344;
  font-size: 15px;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 18px 24px;
  border-top: 1px solid #edf1ee;
  color: #83948a;
  font-size: 11px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

/* NOTIFICATIONS */

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
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
  max-width: 730px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  border-radius: 17px;
  background: white;
  color: #19372b;
  box-shadow: 0 20px 70px #0002;
}

.confirmation-modal {
  max-width: 460px;
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
  margin: 8px 0;
  font-size: 21px;
}

.modal-body {
  padding: 25px;
}

.modal-body p {
  font-size: 13px;
  line-height: 1.8;
}

.modal-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #edf1ee;
  background: #fafcfb;
}

/* FORM */

fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  margin: 0 0 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf1ee;
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  font: inherit;
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

/* EMPLOYEE SELECTION */

.employee-options {
  max-height: 190px;
  overflow-y: auto;
  margin-top: 9px;
  border: 1px solid #dce7df;
  border-radius: 9px;
}

.employee-option {
  display: block;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid #edf1ee;
  background: white;
  color: #19372b;
  text-align: left;
  cursor: pointer;
}

.employee-option:hover {
  background: #f0f8f3;
}

.employee-option strong {
  font-size: 12px;
}

.employee-option small,
.selected-employee small {
  display: block;
  margin-top: 4px;
  color: #83948a;
  font-size: 11px;
}

.option-state {
  padding: 18px;
  color: #83948a;
  font-size: 12px;
  text-align: center;
}

.selected-employee {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border: 1px solid #cce5d5;
  border-radius: 10px;
  background: #f0f8f3;
}

.selected-employee-name {
  flex: 1;
  font-size: 13px;
}

.information-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid #dce9e0;
  border-radius: 8px;
  background: #f4f9f5;
  color: #5d7d69;
  font-size: 11px;
  line-height: 1.7;
}

.information-note svg,
.error-message svg {
  flex-shrink: 0;
}

/* DETAILS */

.detail-profile {
  display: flex;
  align-items: center;
  gap: 17px;
  margin-bottom: 25px;
  padding-bottom: 24px;
  border-bottom: 1px solid #edf1ee;
}

.detail-profile h3 {
  margin: 0;
  font-size: 19px;
}

.detail-profile p {
  margin: 4px 0 10px;
  color: #83948a;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.details-grid label {
  display: block;
  margin-bottom: 7px;
  color: #83948a;
  font-size: 11px;
}

.details-grid strong {
  font-size: 13px;
}

/* EMPLOYMENT HISTORY */

.history-card {
  padding: 18px;
  margin-bottom: 12px;
  border: 1px solid #e4ebe6;
  border-left: 3px solid #087452;
  border-radius: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
  color: #83948a;
  font-size: 11px;
}

/* ANIMATION */

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .contracts-page {
    padding: 18px;
  }

  .page-header,
  .records-header,
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid,
  .form-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .toolbar select {
    max-width: none;
  }

  .table-footer {
    flex-wrap: wrap;
  }

  .modal-backdrop {
    padding: 12px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 18px;
  }

  .modal-footer {
    flex-wrap: wrap;
  }
}
</style>
