
<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  reactive,
  watch,
} from "vue";

import {
  Search,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  Hash,
  AlertCircle,
  Plus,
  Pencil,
  Eye,
  CheckCircle2,
  Save,
  LoaderCircle,
} from "lucide-vue-next";

import { api } from "../lib/api";
import EmployeeAccountModal from "../components/employees/EmployeeAccountModal.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

// ==========================================
// TYPES
// ==========================================

interface Employee {
  id: number;
  employee_no: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  name_extension: string | null;
  birth_date: string | null;
  sex: string | null;
  email: string | null;
  mobile_number: string | null;
  created_at: string;
}

interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface EmployeeForm {
  employee_no: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  name_extension: string;
  birth_date: string;
  sex: string;
  email: string;
  mobile_number: string;
}

// ==========================================
// ACCESS CONTROL
// ==========================================

const canManageEmployees = computed(() => {
  const roles = (auth.user?.roles || []).map(
    (role: any) =>
      typeof role === "string" ? role : role.code
  );

  const uniqueRoles = new Set(roles);

  return (
    uniqueRoles.size === 1 &&
    uniqueRoles.has("ADMIN")
  );
});

// ==========================================
// STATE
// ==========================================

const employees = ref<Employee[]>([]);
const accountEmployee = ref<Employee | null>(null);
const accountStatuses = ref<Record<number, string>>({});
async function accountSaved() {
  accountEmployee.value = null;
  notifySuccess("Employee account saved successfully.");
  await loadEmployees();
}
const selectedEmployee = ref<Employee | null>(null);

const search = ref("");
const appliedSearch = ref("");

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);

const loading = ref(false);
const saving = ref(false);
const detailLoading = ref(false);

const error = ref("");
const detailError = ref("");
const formError = ref("");
const successMessage = ref("");

const detailModalOpen = ref(false);
const formModalOpen = ref(false);

const formMode = ref<"create" | "edit">("create");
const editingEmployeeId = ref<number | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let successTimer: ReturnType<typeof setTimeout> | null = null;

let requestId = 0;
let detailRequestId = 0;

// ==========================================
// FORM
// ==========================================

function emptyForm(): EmployeeForm {
  return {
    employee_no: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    name_extension: "",
    birth_date: "",
    sex: "",
    email: "",
    mobile_number: "",
  };
}

const form = reactive<EmployeeForm>(emptyForm());

const fieldErrors = reactive<
  Partial<Record<keyof EmployeeForm, string>>
>({});

function clearFieldErrors() {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key as keyof EmployeeForm];
  }
}

const formTitle = computed(() =>
  formMode.value === "create"
    ? "Register New Employee"
    : "Edit Employee"
);

const today = computed(() => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
});

// ==========================================
// COMPUTED
// ==========================================

const showingFrom = computed(() =>
  employees.value.length === 0
    ? 0
    : (page.value - 1) * pageSize.value + 1
);

const showingTo = computed(() =>
  employees.value.length === 0
    ? 0
    : Math.min(page.value * pageSize.value, total.value)
);

// ==========================================
// HELPERS
// ==========================================

function fullName(employee: Employee): string {
  return [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
    employee.name_extension,
  ]
    .filter(Boolean)
    .join(" ");
}

function initials(employee: Employee): string {
  return (
    (employee.first_name?.charAt(0) || "") +
    (employee.last_name?.charAt(0) || "")
  ).toUpperCase();
}

function formatDate(value: string | null): string {
  if (!value) return "Not provided";

  const date = new Date(
    `${value.slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (
      err as {
        response?: {
          status?: number;
          data?: {
            detail?: unknown;
          };
        };
      }
    ).response;

    const detail = response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || "Invalid input")
        .join(". ");
    }

    if (response?.status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }
  }

  return fallback;
}

function notifySuccess(message: string) {
  successMessage.value = message;

  if (successTimer) {
    clearTimeout(successTimer);
  }

  successTimer = setTimeout(() => {
    successMessage.value = "";
  }, 5000);
}

// ==========================================
// EMPLOYEE DIRECTORY
// ==========================================

async function loadEmployees() {
  const currentRequest = ++requestId;

  loading.value = true;
  error.value = "";

  try {
    const response = await api.get<EmployeeListResponse>(
      "/employees",
      {
        params: {
          page: page.value,
          page_size: pageSize.value,
          ...(appliedSearch.value
            ? { search: appliedSearch.value }
            : {}),
        },
      }
    );

    if (currentRequest !== requestId) return;

    employees.value = response.data.items;
    total.value = response.data.total;
    totalPages.value = response.data.total_pages;
    accountStatuses.value = {};
    if (canManageEmployees.value) {
      const results = await Promise.allSettled(response.data.items.map(async (employee) => {
        const { data } = await api.get<{ account: { is_active: boolean } | null }>(`/employees/${employee.id}/account`);
        return { id: employee.id, status: data.account ? (data.account.is_active ? "Active" : "Inactive") : "No account" };
      }));
      if (currentRequest !== requestId) return;
      accountStatuses.value = Object.fromEntries(results.map((result, index) => result.status === "fulfilled" ? [result.value.id, result.value.status] : [response.data.items[index]!.id, "Unavailable"]));
    }
  } catch (err) {
    if (currentRequest !== requestId) return;

    employees.value = [];
    total.value = 0;
    totalPages.value = 0;

    error.value = getErrorMessage(
      err,
      "Unable to load employee records."
    );
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
    }
  }
}

watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    appliedSearch.value = value.trim();
    page.value = 1;
    loadEmployees();
  }, 350);
});

watch(pageSize, () => {
  page.value = 1;
  loadEmployees();
});

async function changePage(nextPage: number) {
  if (
    nextPage < 1 ||
    nextPage > totalPages.value ||
    nextPage === page.value
  ) {
    return;
  }

  page.value = nextPage;

  await loadEmployees();
}

// ==========================================
// EMPLOYEE DETAILS
// ==========================================

async function viewEmployee(employee: Employee) {
  const currentRequest = ++detailRequestId;

  selectedEmployee.value = null;
  detailError.value = "";
  detailModalOpen.value = true;
  detailLoading.value = true;

  try {
    const response = await api.get<Employee>(
      `/employees/${employee.id}`
    );

    if (currentRequest !== detailRequestId) return;

    selectedEmployee.value = response.data;
  } catch (err) {
    if (currentRequest !== detailRequestId) return;

    detailError.value = getErrorMessage(
      err,
      "Unable to load employee details."
    );
  } finally {
    if (currentRequest === detailRequestId) {
      detailLoading.value = false;
    }
  }
}

function closeDetailModal() {
  detailRequestId++;
  detailModalOpen.value = false;
  detailLoading.value = false;
  selectedEmployee.value = null;
  detailError.value = "";
}

// ==========================================
// CREATE EMPLOYEE
// ==========================================

function openCreateModal() {
  if (!canManageEmployees.value) return;

  formMode.value = "create";
  editingEmployeeId.value = null;

  Object.assign(form, emptyForm());

  clearFieldErrors();
  formError.value = "";

  formModalOpen.value = true;
}

// ==========================================
// EDIT EMPLOYEE
// ==========================================

function openEditModal(employee: Employee) {
  if (!canManageEmployees.value) return;

  formMode.value = "edit";
  editingEmployeeId.value = employee.id;

  Object.assign(form, {
    employee_no: employee.employee_no,
    first_name: employee.first_name,
    middle_name: employee.middle_name || "",
    last_name: employee.last_name,
    name_extension: employee.name_extension || "",
    birth_date: employee.birth_date?.slice(0, 10) || "",
    sex: employee.sex || "",
    email: employee.email || "",
    mobile_number: employee.mobile_number || "",
  });

  clearFieldErrors();
  formError.value = "";

  closeDetailModal();

  formModalOpen.value = true;
}

function closeFormModal() {
  if (saving.value) return;

  formModalOpen.value = false;
  editingEmployeeId.value = null;

  formError.value = "";
  clearFieldErrors();
}

// ==========================================
// VALIDATION
// ==========================================

function validateForm(): boolean {
  clearFieldErrors();

  if (!form.employee_no.trim()) {
    fieldErrors.employee_no =
      "Employee number is required.";
  }

  if (!form.first_name.trim()) {
    fieldErrors.first_name =
      "First name is required.";
  }

  if (!form.last_name.trim()) {
    fieldErrors.last_name =
      "Last name is required.";
  }

  if (
    form.birth_date &&
    form.birth_date > today.value
  ) {
    fieldErrors.birth_date =
      "Birth date cannot be in the future.";
  }

  if (
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim()
    )
  ) {
    fieldErrors.email =
      "Enter a valid email address.";
  }

  return Object.keys(fieldErrors).length === 0;
}

function applyServerValidation(err: unknown) {
  const detail = (
    err as {
      response?: {
        data?: {
          detail?: unknown;
        };
      };
    }
  )?.response?.data?.detail;

  if (!Array.isArray(detail)) return;

  for (const item of detail) {
    const field = item.loc?.[item.loc.length - 1];

    if (
      typeof field === "string" &&
      Object.prototype.hasOwnProperty.call(form, field)
    ) {
      fieldErrors[field as keyof EmployeeForm] =
        item.msg || "Invalid value";
    }
  }
}

// ==========================================
// SAVE EMPLOYEE
// ==========================================

async function saveEmployee() {
  if (!canManageEmployees.value || saving.value) return;

  formError.value = "";

  if (!validateForm()) {
    formError.value =
      "Please complete the required fields correctly.";

    return;
  }

  const payload = {
    employee_no: form.employee_no.trim(),
    first_name: form.first_name.trim(),
    middle_name: form.middle_name.trim() || null,
    last_name: form.last_name.trim(),
    name_extension: form.name_extension.trim() || null,
    birth_date: form.birth_date || null,
    sex: form.sex.trim() || null,
    email: form.email.trim() || null,
    mobile_number: form.mobile_number.trim() || null,
  };

  saving.value = true;

  try {
    if (formMode.value === "create") {
      await api.post<Employee>(
        "/employees",
        payload
      );

      notifySuccess(
        "Employee registered successfully."
      );
    } else {
      if (editingEmployeeId.value === null) {
        throw new Error("Missing employee ID");
      }

      await api.put<Employee>(
        `/employees/${editingEmployeeId.value}`,
        payload
      );

      notifySuccess(
        "Employee information updated successfully."
      );
    }

    formModalOpen.value = false;
    editingEmployeeId.value = null;

    if (formMode.value === "create") {
      if (searchTimer) clearTimeout(searchTimer);

      search.value = "";
      appliedSearch.value = "";
      page.value = 1;
    }

    await loadEmployees();
  } catch (err) {
    applyServerValidation(err);

    formError.value = getErrorMessage(
      err,
      "Unable to save employee information."
    );

    const status = (
      err as {
        response?: { status?: number };
      }
    )?.response?.status;

    if (status === 409) {
      fieldErrors.employee_no =
        "Employee number already exists.";
    }
  } finally {
    saving.value = false;
  }
}

// ==========================================
// LIFECYCLE
// ==========================================

function handleEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;

  if (formModalOpen.value) {
    closeFormModal();
  } else if (detailModalOpen.value) {
    closeDetailModal();
  }
}

onMounted(() => {
  loadEmployees();

  window.addEventListener(
    "keydown",
    handleEscape
  );
});

onUnmounted(() => {
  requestId++;
  detailRequestId++;

  if (searchTimer) clearTimeout(searchTimer);
  if (successTimer) clearTimeout(successTimer);

  window.removeEventListener(
    "keydown",
    handleEscape
  );
});
</script>

<template>
  <div class="employees-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <div class="eyebrow">EMPLOYEE RECORDS</div>

        <h1>Employee Management</h1>

        <p>
          Browse and manage JO/COS employee records
          across the provincial payroll system.
        </p>
      </div>

      <div class="header-actions">
        <button
          v-if="canManageEmployees"
          type="button"
          class="primary-button"
          @click="openCreateModal"
        >
          <Plus :size="18" />
          Add Employee
        </button>

        <div v-else class="phase-badge">
          <Users :size="16" />
          Employee Directory
        </div>
      </div>
    </div>

    <!-- SUCCESS NOTIFICATION -->
    <Transition name="fade">
      <div
        v-if="successMessage"
        class="success-message"
        role="status"
      >
        <CheckCircle2 :size="20" />

        <span>{{ successMessage }}</span>

        <button
          type="button"
          aria-label="Dismiss notification"
          @click="successMessage = ''"
        >
          <X :size="17" />
        </button>
      </div>
    </Transition>

    <!-- SUMMARY -->
    <section class="summary-card">
      <div class="summary-icon">
        <Users :size="25" />
      </div>

      <div>
        <span>
          {{
            appliedSearch
              ? "Matching Employee Records"
              : "Total Employee Records"
          }}
        </span>

        <strong>{{ loading ? "—" : total }}</strong>

        <small>
          {{
            appliedSearch
              ? "Matching the current search"
              : "Employees available to your account"
          }}
        </small>
      </div>
    </section>

    <!-- DIRECTORY -->
    <section class="directory-card">

      <div class="directory-heading">
        <div>
          <h2>Employee Directory</h2>

          <p>
            Search employees by name or employee number.
          </p>
        </div>

        <button
          type="button"
          class="secondary-button"
          :disabled="loading"
          @click="loadEmployees"
        >
          <RefreshCw
            :size="16"
            :class="{ spinning: loading }"
          />

          Refresh
        </button>
      </div>

      <!-- SEARCH -->
      <div class="toolbar">
        <div class="search-field">
          <Search :size="18" />

          <input
            v-model="search"
            type="search"
            maxlength="150"
            aria-label="Search employees"
            placeholder="Search employee name or ID..."
          />
        </div>

        <select
          v-model.number="pageSize"
          class="page-size"
          aria-label="Employees per page"
        >
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>
      </div>

      <!-- API ERROR -->
      <div v-if="error" class="error-message" role="alert">
        <AlertCircle :size="18" />
        {{ error }}
      </div>

      <!-- TABLE -->
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee No.</th>
              <th>Sex</th>
              <th>Contact</th>
              <th v-if="canManageEmployees">Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td :colspan="canManageEmployees ? 6 : 5" class="table-state">
                <LoaderCircle
                  :size="25"
                  class="spinning state-icon"
                />

                Loading employee records...
              </td>
            </tr>

            <tr
              v-for="employee in loading ? [] : employees"
              :key="employee.id"
            >
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar">
                    {{ initials(employee) }}
                  </div>

                  <div>
                    <strong>
                      {{ fullName(employee) }}
                    </strong>

                    <small>
                      Employee record #{{ employee.id }}
                    </small>
                  </div>
                </div>
              </td>

              <td>
                <span class="employee-number">
                  {{ employee.employee_no }}
                </span>
              </td>

              <td>{{ employee.sex || "—" }}</td>

              <td>
                <div class="contact-cell">
                  <span>
                    {{ employee.email || "No email" }}
                  </span>

                  <small>
                    {{
                      employee.mobile_number ||
                      "No mobile number"
                    }}
                  </small>
                </div>
              </td>

              <td v-if="canManageEmployees">
                {{ accountStatuses[employee.id] || "Loading..." }}
              </td>
              <td>
                <div class="table-actions">
                  <button
                    type="button"
                    class="action-button view-button"
                    title="View employee details"
                    @click="viewEmployee(employee)"
                  >
                    <Eye :size="15" />
                    View
                  </button>

                  <button
                    v-if="canManageEmployees"
                    type="button"
                    class="action-button edit-button"
                    title="Edit employee"
                    @click="openEditModal(employee)"
                  >
                    <Pencil :size="14" />
                    Edit
                  </button>
                  <button v-if="canManageEmployees" type="button" class="action-button view-button" @click="accountEmployee = employee">
                    <UserRound :size="15" /> Account
                  </button>
                </div>
              </td>
            </tr>

            <!-- EMPTY STATE -->
            <tr
              v-if="
                !loading &&
                !error &&
                employees.length === 0
              "
            >
              <td :colspan="canManageEmployees ? 6 : 5" class="table-state">
                <div class="empty-state">
                  <div class="empty-icon">
                    <Users :size="29" />
                  </div>

                  <h3>No employees found</h3>

                  <p>
                    {{
                      appliedSearch
                        ? "Try a different employee name or number."
                        : "There are no employee records available."
                    }}
                  </p>

                  <button
                    v-if="
                      canManageEmployees &&
                      !appliedSearch
                    "
                    type="button"
                    class="primary-button"
                    @click="openCreateModal"
                  >
                    <Plus :size="16" />
                    Register Employee
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="pagination">
        <span>
          Showing {{ showingFrom }}–{{ showingTo }}
          of {{ total }} employees
        </span>

        <div class="pagination-actions">
          <button
            type="button"
            aria-label="Previous page"
            :disabled="loading || page <= 1"
            @click="changePage(page - 1)"
          >
            <ChevronLeft :size="17" />
          </button>

          <span>
            Page {{ page }} of
            {{ Math.max(totalPages, 1) }}
          </span>

          <button
            type="button"
            aria-label="Next page"
            :disabled="loading || page >= totalPages"
            @click="changePage(page + 1)"
          >
            <ChevronRight :size="17" />
          </button>
        </div>
      </div>
    </section>

    <EmployeeAccountModal v-if="accountEmployee && canManageEmployees" :key="accountEmployee.id" :employee="accountEmployee" @close="accountEmployee = null" @saved="accountSaved" />

    <!-- EMPLOYEE DETAILS MODAL -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="detailModalOpen"
          class="modal-backdrop"
          @click.self="closeDetailModal"
        >
          <section
            class="modal details-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Employee details"
          >
            <div class="modal-header">
              <div>
                <div class="eyebrow">
                  EMPLOYEE PROFILE
                </div>

                <h2>Employee Details</h2>
              </div>

              <button
                type="button"
                class="close-button"
                aria-label="Close"
                @click="closeDetailModal"
              >
                <X :size="20" />
              </button>
            </div>

            <div
              v-if="detailLoading"
              class="modal-state"
            >
              Loading employee details...
            </div>

            <div
              v-else-if="detailError"
              class="error-message"
              role="alert"
            >
              {{ detailError }}
            </div>

            <div
              v-else-if="selectedEmployee"
              class="modal-body"
            >
              <div class="profile-heading">
                <div class="profile-avatar">
                  {{ initials(selectedEmployee) }}
                </div>

                <div>
                  <h3>
                    {{ fullName(selectedEmployee) }}
                  </h3>

                  <span>
                    {{ selectedEmployee.employee_no }}
                  </span>
                </div>
              </div>

              <div class="detail-grid">
                <div class="detail-item">
                  <Hash :size="17" />

                  <div>
                    <span>Employee Number</span>

                    <strong>
                      {{ selectedEmployee.employee_no }}
                    </strong>
                  </div>
                </div>

                <div class="detail-item">
                  <UserRound :size="17" />

                  <div>
                    <span>Sex</span>

                    <strong>
                      {{
                        selectedEmployee.sex ||
                        "Not provided"
                      }}
                    </strong>
                  </div>
                </div>

                <div class="detail-item">
                  <CalendarDays :size="17" />

                  <div>
                    <span>Birth Date</span>

                    <strong>
                      {{
                        formatDate(
                          selectedEmployee.birth_date
                        )
                      }}
                    </strong>
                  </div>
                </div>

                <div class="detail-item">
                  <Mail :size="17" />

                  <div>
                    <span>Email Address</span>

                    <strong>
                      {{
                        selectedEmployee.email ||
                        "Not provided"
                      }}
                    </strong>
                  </div>
                </div>

                <div class="detail-item">
                  <Phone :size="17" />

                  <div>
                    <span>Mobile Number</span>

                    <strong>
                      {{
                        selectedEmployee.mobile_number ||
                        "Not provided"
                      }}
                    </strong>
                  </div>
                </div>

                <div class="detail-item">
                  <CalendarDays :size="17" />

                  <div>
                    <span>Record Created</span>

                    <strong>
                      {{
                        formatDate(
                          selectedEmployee.created_at
                        )
                      }}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="secondary-button"
                @click="closeDetailModal"
              >
                Close
              </button>

              <button
                v-if="
                  canManageEmployees &&
                  selectedEmployee
                "
                type="button"
                class="primary-button"
                @click="openEditModal(selectedEmployee)"
              >
                <Pencil :size="15" />
                Edit Employee
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>

    <!-- CREATE / EDIT EMPLOYEE MODAL -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="formModalOpen"
          class="modal-backdrop"
          @click.self="closeFormModal"
        >
          <section
            class="modal form-modal"
            role="dialog"
            aria-modal="true"
            :aria-label="formTitle"
          >
            <div class="modal-header">
              <div>
                <div class="eyebrow">
                  EMPLOYEE MANAGEMENT
                </div>

                <h2>{{ formTitle }}</h2>

                <p>
                  {{
                    formMode === "create"
                      ? "Enter the employee's personal information."
                      : "Update the employee's existing information."
                  }}
                </p>
              </div>

              <button
                type="button"
                class="close-button"
                aria-label="Close"
                :disabled="saving"
                @click="closeFormModal"
              >
                <X :size="20" />
              </button>
            </div>

            <form
              novalidate
              @submit.prevent="saveEmployee"
            >
              <div class="modal-body">

                <div
                  v-if="formError"
                  class="form-error"
                  role="alert"
                >
                  <AlertCircle :size="19" />
                  <span>{{ formError }}</span>
                </div>

                <fieldset
                  class="form-fieldset"
                  :disabled="saving"
                >
                  <div class="form-section-title">
                    <UserRound :size="18" />

                    <div>
                      <strong>Personal Information</strong>

                      <small>
                        Fields marked with * are required.
                      </small>
                    </div>
                  </div>

                  <div class="form-grid">

                    <!-- EMPLOYEE NUMBER -->
                    <div class="form-group full-width">
                      <label for="employee-no">
                        Employee Number
                        <span class="required">*</span>
                      </label>

                      <input
                        id="employee-no"
                        v-model="form.employee_no"
                        type="text"
                        maxlength="50"
                        placeholder="Enter employee number"
                        :class="{
                          invalid: fieldErrors.employee_no
                        }"
                      />

                      <small
                        v-if="fieldErrors.employee_no"
                        class="field-error"
                      >
                        {{ fieldErrors.employee_no }}
                      </small>
                    </div>

                    <!-- FIRST NAME -->
                    <div class="form-group">
                      <label for="first-name">
                        First Name
                        <span class="required">*</span>
                      </label>

                      <input
                        id="first-name"
                        v-model="form.first_name"
                        type="text"
                        maxlength="150"
                        placeholder="First name"
                        :class="{
                          invalid: fieldErrors.first_name
                        }"
                      />

                      <small
                        v-if="fieldErrors.first_name"
                        class="field-error"
                      >
                        {{ fieldErrors.first_name }}
                      </small>
                    </div>

                    <!-- MIDDLE NAME -->
                    <div class="form-group">
                      <label for="middle-name">
                        Middle Name
                      </label>

                      <input
                        id="middle-name"
                        v-model="form.middle_name"
                        type="text"
                        maxlength="150"
                        placeholder="Middle name"
                      />
                    </div>

                    <!-- LAST NAME -->
                    <div class="form-group">
                      <label for="last-name">
                        Last Name
                        <span class="required">*</span>
                      </label>

                      <input
                        id="last-name"
                        v-model="form.last_name"
                        type="text"
                        maxlength="150"
                        placeholder="Last name"
                        :class="{
                          invalid: fieldErrors.last_name
                        }"
                      />

                      <small
                        v-if="fieldErrors.last_name"
                        class="field-error"
                      >
                        {{ fieldErrors.last_name }}
                      </small>
                    </div>

                    <!-- NAME EXTENSION -->
                    <div class="form-group">
                      <label for="name-extension">
                        Name Extension
                      </label>

                      <input
                        id="name-extension"
                        v-model="form.name_extension"
                        type="text"
                        maxlength="30"
                        placeholder="Jr., Sr., III, etc."
                      />
                    </div>

                    <!-- BIRTH DATE -->
                    <div class="form-group">
                      <label for="birth-date">
                        Birth Date
                      </label>

                      <input
                        id="birth-date"
                        v-model="form.birth_date"
                        type="date"
                        :max="today"
                        :class="{
                          invalid: fieldErrors.birth_date
                        }"
                      />

                      <small
                        v-if="fieldErrors.birth_date"
                        class="field-error"
                      >
                        {{ fieldErrors.birth_date }}
                      </small>
                    </div>

                    <!-- SEX -->
                    <div class="form-group">
                      <label for="employee-sex">
                        Sex
                      </label>

                      <select
                        id="employee-sex"
                        v-model="form.sex"
                      >
                        <option value="">
                          Select sex
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option
                          v-if="
                            form.sex &&
                            !['Male', 'Female'].includes(form.sex)
                          "
                          :value="form.sex"
                        >
                          {{ form.sex }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="form-section-title contact-title">
                    <Phone :size="18" />

                    <div>
                      <strong>Contact Information</strong>

                      <small>
                        Employee contact details.
                      </small>
                    </div>
                  </div>

                  <div class="form-grid">

                    <!-- EMAIL -->
                    <div class="form-group">
                      <label for="employee-email">
                        Email Address
                      </label>

                      <input
                        id="employee-email"
                        v-model="form.email"
                        type="email"
                        maxlength="255"
                        placeholder="employee@example.com"
                        :class="{
                          invalid: fieldErrors.email
                        }"
                      />

                      <small
                        v-if="fieldErrors.email"
                        class="field-error"
                      >
                        {{ fieldErrors.email }}
                      </small>
                    </div>

                    <!-- MOBILE NUMBER -->
                    <div class="form-group">
                      <label for="mobile-number">
                        Mobile Number
                      </label>

                      <input
                        id="mobile-number"
                        v-model="form.mobile_number"
                        type="tel"
                        maxlength="30"
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                  </div>
                </fieldset>

                <div
                  v-if="formMode === 'create'"
                  class="information-note"
                >
                  <AlertCircle :size="17" />

                  <span>
                    Employment contracts, department assignments,
                    positions, and salary rates will be managed
                    separately from personal information.
                  </span>
                </div>
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  class="secondary-button"
                  :disabled="saving"
                  @click="closeFormModal"
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
                      : formMode === "create"
                        ? "Register Employee"
                        : "Save Changes"
                  }}
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ==========================================
   PAGE LAYOUT
========================================== */

.employees-page {
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
.directory-heading p {
  color: #83948a;
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-badge {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 14px;
  border-radius: 100px;
  background: #e9f6ed;
  color: #087452;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* ==========================================
   BUTTONS
========================================== */

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 17px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.primary-button {
  border: 1px solid #087452;
  background: #087452;
  color: white;
}

.primary-button:hover {
  background: #065b41;
}

.secondary-button {
  border: 1px solid #dce8df;
  background: white;
  color: #245b42;
}

.secondary-button:hover {
  background: #f3f8f4;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ==========================================
   SUMMARY
========================================== */

.summary-card {
  display: flex;
  align-items: center;
  gap: 19px;
  padding: 25px;
  border: 1px solid #e4ebe6;
  border-radius: 14px;
  background: white;
  margin-bottom: 25px;
}

.summary-icon {
  display: grid;
  place-items: center;
  width: 55px;
  height: 55px;
  border-radius: 13px;
  background: #e4f4e9;
  color: #087452;
}

.summary-card span,
.summary-card strong,
.summary-card small {
  display: block;
}

.summary-card span {
  color: #819287;
  font-size: 12px;
}

.summary-card strong {
  font-size: 29px;
  margin: 6px 0;
}

.summary-card small {
  color: #91a096;
  font-size: 11px;
}

/* ==========================================
   DIRECTORY
========================================== */

.directory-card {
  border: 1px solid #e4ebe6;
  border-radius: 14px;
  background: white;
  overflow: hidden;
}

.directory-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 24px;
}

.directory-heading h2 {
  font-size: 17px;
  margin: 0 0 6px;
}

.toolbar {
  display: flex;
  gap: 14px;
  padding: 0 24px 22px;
}

.search-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid #dce7df;
  border-radius: 9px;
  padding: 0 14px;
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

.page-size {
  border: 1px solid #dce7df;
  border-radius: 9px;
  padding: 10px 12px;
  background: white;
  color: #526b5a;
  font-family: inherit;
}

/* ==========================================
   TABLE
========================================== */

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  padding: 15px 24px;
  background: #f7faf8;
  color: #8a9c90;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  white-space: nowrap;
}

td {
  padding: 18px 24px;
  border-top: 1px solid #edf1ee;
  font-size: 12px;
}

tbody tr:hover {
  background: #fbfdfb;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 185px;
}

.employee-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #e7f4eb;
  color: #087452;
  font-weight: 800;
}

.employee-cell strong,
.employee-cell small,
.contact-cell span,
.contact-cell small {
  display: block;
}

.employee-cell small,
.contact-cell small {
  margin-top: 5px;
  color: #98a69c;
  font-size: 10px;
}

.employee-number {
  font-weight: 700;
  color: #275c43;
  white-space: nowrap;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 7px;
  padding: 8px 11px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.view-button {
  border: 1px solid #cde5d4;
  background: #eff8f1;
  color: #087452;
}

.view-button:hover {
  background: #def0e4;
}

.edit-button {
  border: 1px solid #dce5eb;
  background: #f5f8fb;
  color: #41627d;
}

.edit-button:hover {
  background: #e8eff6;
}

.table-state {
  padding: 45px;
  text-align: center;
  color: #91a096;
}

.state-icon {
  display: block;
  margin: 0 auto 12px;
  color: #087452;
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

/* ==========================================
   PAGINATION
========================================== */

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 20px 24px;
  border-top: 1px solid #edf1ee;
  color: #85968a;
  font-size: 11px;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pagination-actions button,
.close-button {
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

/* ==========================================
   NOTIFICATIONS
========================================== */

.error-message,
.success-message,
.form-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  font-size: 12px;
  line-height: 1.6;
}

.error-message,
.form-error {
  background: #fff1f0;
  color: #b34343;
}

.success-message {
  margin-bottom: 20px;
  border: 1px solid #cbe6d4;
  border-radius: 10px;
  background: #eaf7ee;
  color: #167448;
}

.success-message span {
  flex: 1;
}

.success-message button {
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.form-error {
  border: 1px solid #f3d1d1;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-error svg,
.information-note svg {
  flex-shrink: 0;
}

/* ==========================================
   MODALS
========================================== */

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
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 17px;
  background: white;
  color: #19372b;
  box-shadow: 0 20px 70px #0002;
}

.details-modal {
  max-width: 680px;
}

.form-modal {
  max-width: 760px;
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
  margin: 9px 0 0;
  font-size: 21px;
  letter-spacing: -0.4px;
}

.modal-header p {
  margin: 8px 0 0;
  font-size: 12px;
  color: #83948a;
  line-height: 1.6;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #edf1ee;
  background: #fafcfb;
}

.modal-state {
  padding: 35px;
  text-align: center;
  color: #84978a;
}

/* ==========================================
   EMPLOYEE PROFILE
========================================== */

.profile-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 25px;
  border-bottom: 1px solid #edf1ee;
}

.profile-avatar {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 14px;
  background: #e4f4e9;
  color: #087452;
  font-size: 20px;
  font-weight: 800;
}

.profile-heading h3 {
  margin: 0 0 6px;
}

.profile-heading span {
  color: #8b9d90;
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 25px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.detail-item svg {
  color: #087452;
  flex-shrink: 0;
}

.detail-item span,
.detail-item strong {
  display: block;
}

.detail-item span {
  color: #91a096;
  font-size: 11px;
}

.detail-item strong {
  margin-top: 6px;
  font-size: 12px;
  overflow-wrap: anywhere;
}

/* ==========================================
   EMPLOYEE FORM
========================================== */

.form-fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #edf1ee;
}

.form-section-title svg {
  color: #087452;
}

.form-section-title strong,
.form-section-title small {
  display: block;
}

.form-section-title strong {
  font-size: 13px;
}

.form-section-title small {
  margin-top: 5px;
  font-size: 11px;
  color: #91a096;
}

.contact-title {
  margin-top: 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px;
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
  font-size: 12px;
  font-weight: 650;
  color: #365344;
}

.required {
  color: #b34343;
}

.form-group input,
.form-group select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 43px;
  padding: 11px 13px;
  border: 1px solid #dce7df;
  border-radius: 8px;
  outline: none;
  background: white;
  color: #19372b;
  font-family: inherit;
  font-size: 12px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input::placeholder {
  color: #a0ada4;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #087452;
  box-shadow: 0 0 0 3px #08745212;
}

.form-group input.invalid {
  border-color: #d65c5c;
}

.field-error {
  color: #b34343;
  font-size: 11px;
}

.information-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  margin-top: 25px;
  border: 1px solid #dce9e0;
  border-radius: 8px;
  background: #f4f9f5;
  color: #5d7d69;
  font-size: 11px;
  line-height: 1.7;
}

/* ==========================================
   ANIMATIONS
========================================== */

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

/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 900px) {
  .employees-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .employees-page {
    padding: 18px;
  }

  .toolbar,
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .directory-heading {
    align-items: flex-start;
  }

  .modal-backdrop {
    padding: 12px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }

  .modal-footer button {
    flex: 1;
  }

  .phase-badge {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
