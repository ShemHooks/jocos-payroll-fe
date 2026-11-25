<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../../lib/api";

import {
  UserRound,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  X,
} from "lucide-vue-next";

type Account = {
  id: number;
  employee_id: number | null;
  username: string;
  email: string | null;
  is_active: boolean;
  must_change_password: boolean;
  password_reset_at: string | null;
  password_changed_at: string | null;
};

type Candidate = {
  id: number;
  username: string;
  email: string | null;
  is_active: boolean;
};

const props = defineProps<{
  employee: {
    id: number;
    employee_no: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const router = useRouter();

const account = ref<Account | null>(null);
const candidates = ref<Candidate[]>([]);

const mode = ref<"create" | "link">("create");

const username = ref(props.employee.employee_no);
const email = ref(props.employee.email || "");
const password = ref("");

const userId = ref<number | null>(null);
const verified = ref(false);
const credentialsConfirmed = ref(false);

const loading = ref(true);
const saving = ref(false);
const ready = ref(false);

const error = ref("");
const notice = ref("");
const showPassword = ref(false);

const base = `/employees/${props.employee.id}`;

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

const employeeName = computed(
  () =>
    `${props.employee.first_name} ${props.employee.last_name}`
);

const passwordIssued = computed(
  () => Boolean(account.value?.password_reset_at)
);

const activationReady = computed(
  () =>
    account.value?.employee_id === props.employee.id &&
    passwordIssued.value
);

const securityStatus = computed(() => {
  if (!account.value) {
    return "No account";
  }

  if (account.value.password_reset_at === undefined) {
    return "Security status unavailable";
  }

  if (!passwordIssued.value) {
    return "Password reset required";
  }

  if (account.value.must_change_password) {
    return "Password change required";
  }

  return "Password configured";
});

const validPassword = computed(
  () =>
    password.value.length >= 12 &&
    password.value.length <= 128 &&
    Boolean(password.value.trim())
);

const canSave = computed(() => {
  if (
    saving.value ||
    loading.value ||
    !ready.value ||
    account.value
  ) {
    return false;
  }

  if (mode.value === "create") {
    return (
      username.value.trim().length >= 3 &&
      validPassword.value &&
      credentialsConfirmed.value
    );
  }

  return Boolean(userId.value && verified.value);
});

// ==========================================
// ERROR HANDLING
// ==========================================

function message(e: unknown): string {
  const err = e as {
    response?: {
      data?: {
        detail?: unknown;
      };
    };
    message?: string;
  };

  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || "Invalid field")
      .join("; ");
  }

  return (
    err.message ||
    "Request failed. Check the account status before retrying."
  );
}

// ==========================================
// LOAD ACCOUNT
// ==========================================

async function load() {
  loading.value = true;
  ready.value = false;
  error.value = "";
  notice.value = "";

  try {
    const response = await api.get<{
      account: Account | null;
    }>(`${base}/account`);

    account.value = response.data.account;

    candidates.value = [];

    if (!account.value) {
      const available = await api.get<Candidate[]>(
        `${base}/available-accounts`
      );

      candidates.value = available.data;
    }

    ready.value = true;
  } catch (e) {
    error.value = message(e);
  } finally {
    loading.value = false;
  }
}

// ==========================================
// PASSWORD MANAGEMENT
// ==========================================

function generate() {
  const bytes = crypto.getRandomValues(
    new Uint8Array(24)
  );

  password.value = Array.from(
    bytes,
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("");

  showPassword.value = true;
  credentialsConfirmed.value = false;

  error.value = "";
  notice.value = "";
}

async function copyPassword() {
  if (!password.value) return;

  try {
    await navigator.clipboard.writeText(
      password.value
    );

    notice.value = "Temporary password copied.";
  } catch {
    error.value =
      "Unable to copy automatically. Copy the password manually.";
  }
}

function clearCredentials() {
  password.value = "";
  showPassword.value = false;
  credentialsConfirmed.value = false;
  notice.value = "";
}

function changeMode(value: "create" | "link") {
  if (saving.value) return;

  mode.value = value;
  error.value = "";
  verified.value = false;
  userId.value = null;

  clearCredentials();
}

// ==========================================
// SAVE ACCOUNT
// ==========================================

async function save() {
  if (!canSave.value) return;

  saving.value = true;
  error.value = "";
  notice.value = "";

  try {
    if (mode.value === "create") {
      await api.post<Account>(
        `${base}/account`,
        {
          username: username.value.trim(),
          email: email.value.trim() || null,
          password: password.value,
        }
      );
    } else {
      await api.put<Account>(
        `${base}/account/link`,
        {
          user_id: userId.value,
        }
      );
    }

    clearCredentials();

    emit("saved");
  } catch (e) {
    error.value = message(e);
  } finally {
    saving.value = false;
  }
}

// ==========================================
// NAVIGATION
// ==========================================

function close() {
  if (saving.value) return;

  clearCredentials();

  emit("close");
}

function goToUsers() {
  if (saving.value) return;

  close();

  void router.push("/dashboard/users");
}

onMounted(load);
</script>

<template>
  <Teleport to="body">
    <div
      class="account-overlay"
      @click.self="close"
      @keydown.esc.stop="close"
    >
      <section
        class="account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-account-title"
      >
        <!-- HEADER -->

        <header class="modal-header">
          <div>
            <small class="eyebrow">
              EMPLOYEE SELF-SERVICE
            </small>

            <h2 id="employee-account-title">
              Employee Account
            </h2>

            <p>
              {{ employeeName }}
              · {{ employee.employee_no }}
            </p>
          </div>

          <button
            type="button"
            class="close-button"
            :disabled="saving"
            aria-label="Close"
            @click="close"
          >
            <X :size="22" />
          </button>
        </header>

        <div class="modal-body">

          <!-- LOADING -->

          <div v-if="loading" class="loading-state">
            <RefreshCw :size="22" class="spinner" />

            <p>Loading account information...</p>
          </div>

          <!-- MESSAGES -->

          <div
            v-if="error"
            class="message error"
            role="alert"
          >
            <CircleAlert :size="18" />
            <span>{{ error }}</span>
          </div>

          <div
            v-if="notice"
            class="message success"
            role="status"
          >
            <CheckCircle2 :size="18" />
            <span>{{ notice }}</span>
          </div>

          <button
            v-if="!loading && !ready"
            type="button"
            class="btn secondary"
            @click="load"
          >
            <RefreshCw :size="16" />
            Retry
          </button>

          <!-- EXISTING ACCOUNT -->

          <template v-if="ready && account">
            <div class="account-summary">
              <div class="account-avatar">
                <UserRound :size="25" />
              </div>

              <div class="account-details">
                <strong>{{ account.username }}</strong>

                <span>
                  {{ account.email || "No email provided" }}
                </span>
              </div>

              <span
                class="status-pill"
                :class="
                  account.is_active
                    ? 'active'
                    : 'inactive'
                "
              >
                {{
                  account.is_active
                    ? "Active"
                    : "Inactive"
                }}
              </span>
            </div>

            <!-- SECURITY CHECKLIST -->

            <section class="security-section">
              <div class="section-heading">
                <ShieldCheck :size="20" />

                <h3>Account Security</h3>
              </div>

              <div class="security-row">
                <CheckCircle2
                  v-if="account.employee_id === employee.id"
                  :size="20"
                  class="valid-icon"
                />

                <CircleAlert
                  v-else
                  :size="20"
                  class="warning-icon"
                />

                <div>
                  <strong>Employee Identity</strong>

                  <p>
                    {{
                      account.employee_id === employee.id
                        ? "Linked to this employee record."
                        : "Employee link requires verification."
                    }}
                  </p>
                </div>
              </div>

              <div class="security-row">
                <CheckCircle2
                  v-if="passwordIssued"
                  :size="20"
                  class="valid-icon"
                />

                <KeyRound
                  v-else
                  :size="20"
                  class="warning-icon"
                />

                <div>
                  <strong>Password Security</strong>
                  <p>{{ securityStatus }}</p>
                </div>
              </div>

              <div class="security-row">
                <CheckCircle2
                  v-if="activationReady"
                  :size="20"
                  class="valid-icon"
                />

                <LockKeyhole
                  v-else
                  :size="20"
                  class="warning-icon"
                />

                <div>
                  <strong>Activation Readiness</strong>

                  <p>
                    {{
                      activationReady
                        ? "Password provisioning requirements met."
                        : "Complete password provisioning first."
                    }}
                  </p>
                </div>
              </div>
            </section>

            <!-- SECURITY NOTICE -->

            <div
              v-if="!passwordIssued"
              class="info warning"
            >
              <ShieldAlert :size="20" />

              <div>
                <strong>Password reset required</strong>

                <p>
                  Issue a temporary password in Users
                  &amp; Access before activating this account.
                </p>
              </div>
            </div>

            <div
              v-else-if="account.must_change_password"
              class="info warning"
            >
              <KeyRound :size="20" />

              <div>
                <strong>First-login security</strong>

                <p>
                  The employee must change the temporary
                  password before accessing the payroll system.
                </p>
              </div>
            </div>

            <div v-else class="info">
              <ShieldCheck :size="20" />

              <div>
                <strong>Password configured</strong>

                <p>
                  Manage account activation, deactivation,
                  and password resets in Users &amp; Access.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="btn primary full-button"
              @click="goToUsers"
            >
              Manage Account Security
              <ArrowRight :size="17" />
            </button>
          </template>

          <!-- CREATE OR LINK ACCOUNT -->

          <form
            v-else-if="ready"
            @submit.prevent="save"
          >
            <fieldset :disabled="saving">

              <div class="tabs">
                <button
                  type="button"
                  :class="{ selected: mode === 'create' }"
                  @click="changeMode('create')"
                >
                  Create Account
                </button>

                <button
                  type="button"
                  :class="{ selected: mode === 'link' }"
                  @click="changeMode('link')"
                >
                  Link Existing
                </button>
              </div>

              <!-- CREATE ACCOUNT -->

              <template v-if="mode === 'create'">
                <label class="field">
                  Username

                  <input
                    v-model="username"
                    required
                    minlength="3"
                    maxlength="120"
                    autocomplete="off"
                  />
                </label>

                <label class="field">
                  Email (optional)

                  <input
                    v-model="email"
                    type="email"
                    maxlength="255"
                  />
                </label>

                <label class="field">
                  Temporary Password

                  <div class="password-wrapper">
                    <input
                      v-model="password"
                      :type="
                        showPassword
                          ? 'text'
                          : 'password'
                      "
                      required
                      minlength="12"
                      maxlength="128"
                      autocomplete="new-password"
                      @input="
                        credentialsConfirmed = false;
                        notice = '';
                      "
                    />

                    <button
                      type="button"
                      class="visibility-button"
                      :aria-label="
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      "
                      @click="
                        showPassword = !showPassword
                      "
                    >
                      <EyeOff
                        v-if="showPassword"
                        :size="18"
                      />

                      <Eye v-else :size="18" />
                    </button>
                  </div>
                </label>

                <div class="password-actions">
                  <button
                    type="button"
                    class="btn secondary"
                    @click="generate"
                  >
                    <KeyRound :size="16" />
                    Generate Password
                  </button>

                  <button
                    type="button"
                    class="btn secondary"
                    :disabled="!password"
                    @click="copyPassword"
                  >
                    <Copy :size="16" />
                    Copy
                  </button>
                </div>

                <p class="helper-text">
                  Use at least 12 characters. The employee
                  must change this temporary password
                  on their first login.
                </p>

                <label class="confirmation">
                  <input
                    v-model="credentialsConfirmed"
                    type="checkbox"
                    required
                  />

                  <span>
                    I have securely recorded the temporary
                    password and will provide it directly
                    to the verified employee.
                  </span>
                </label>
              </template>

              <!-- LINK EXISTING ACCOUNT -->

              <template v-else>
                <label class="field">
                  Existing Inactive Account

                  <select
                    v-model="userId"
                    required
                    @change="verified = false"
                  >
                    <option :value="null" disabled>
                      Select an account
                    </option>

                    <option
                      v-for="candidate in candidates"
                      :key="candidate.id"
                      :value="candidate.id"
                    >
                      {{ candidate.username }}
                      —
                      {{ candidate.email || "No email" }}
                    </option>
                  </select>
                </label>

                <p
                  v-if="!candidates.length"
                  class="helper-text"
                >
                  No eligible unlinked accounts found.
                </p>

                <label class="confirmation">
                  <input
                    v-model="verified"
                    type="checkbox"
                    required
                  />

                  <span>
                    I verified that this account belongs
                    to this employee.
                  </span>
                </label>
              </template>

              <!-- ROLE AND ACTIVATION -->

              <div class="info">
                <ShieldCheck :size="21" />

                <div>
                  <strong>Role: Employee</strong>

                  <p>
                    The account will remain inactive
                    until an administrator activates it.
                  </p>

                  <p v-if="mode === 'link'">
                    Existing account credentials must
                    be reset before activation.
                  </p>

                  <p v-else>
                    Activate the account through
                    Users &amp; Access after creation.
                  </p>
                </div>
              </div>

              <footer class="modal-footer">
                <button
                  type="button"
                  class="btn secondary"
                  @click="close"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  class="btn primary"
                  :disabled="!canSave"
                >
                  {{
                    saving
                      ? "Saving..."
                      : mode === "create"
                        ? "Create Account"
                        : "Link Account"
                  }}
                </button>
              </footer>

            </fieldset>
          </form>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.account-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: #10241f99;
  display: grid;
  place-items: center;
  padding: 18px;
  font-family: Inter, system-ui, sans-serif;
  color: #17352f;
}

.account-overlay * {
  box-sizing: border-box;
}

.account-modal {
  background: white;
  border-radius: 17px;
  width: min(100%, 580px);
  max-height: 92vh;
  overflow: auto;
  box-shadow: 0 24px 70px #10241f30;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px;
  border-bottom: 1px solid #edf1ee;
}

.eyebrow {
  color: #087b60;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.modal-header h2 {
  margin: 7px 0;
  font-size: 24px;
  letter-spacing: -0.5px;
}

.modal-header p {
  color: #788b82;
  font-size: 12px;
  margin: 6px 0 0;
}

.close-button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #84958c;
  cursor: pointer;
  padding: 6px;
}

.modal-body {
  padding: 25px;
}

fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.loading-state {
  padding: 35px;
  text-align: center;
  color: #788b82;
  font-size: 13px;
}

.spinner {
  color: #087b60;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 17px;
  border: 1px solid #e1eae6;
  border-radius: 12px;
}

.account-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: #e3f3ec;
  color: #087b60;
  border-radius: 12px;
}

.account-details {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.account-details strong {
  display: block;
  font-size: 15px;
}

.account-details span {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #84958c;
}

.status-pill {
  padding: 6px 11px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.status-pill.active {
  background: #e5f7ed;
  color: #168354;
}

.status-pill.inactive {
  background: #f1f3f4;
  color: #84918b;
}

.security-section {
  margin: 25px 0;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #087b60;
  margin-bottom: 12px;
}

.section-heading h3 {
  font-size: 14px;
  margin: 0;
}

.security-row {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 15px 0;
  border-bottom: 1px solid #edf1ee;
}

.security-row svg {
  flex-shrink: 0;
}

.security-row strong {
  font-size: 13px;
}

.security-row p {
  color: #788b82;
  font-size: 12px;
  line-height: 1.6;
  margin: 5px 0 0;
}

.valid-icon {
  color: #087b60;
}

.warning-icon {
  color: #b47b20;
}

.tabs {
  display: flex;
  padding: 4px;
  gap: 5px;
  border-radius: 10px;
  background: #f0f5f2;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  border: 0;
  background: transparent;
  border-radius: 7px;
  padding: 11px;
  color: #71847d;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tabs button.selected {
  background: white;
  color: #087b60;
  box-shadow: 0 2px 7px #17352f0d;
}

.field {
  display: grid;
  gap: 8px;
  margin: 18px 0;
  font-size: 13px;
  font-weight: 650;
}

.field input,
.field select {
  width: 100%;
  min-height: 45px;
  padding: 11px 13px;
  border: 1px solid #d9e5df;
  border-radius: 8px;
  background: white;
  color: #17352f;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: #087b60;
  box-shadow: 0 0 0 3px #087b6018;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 45px;
}

.visibility-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #84958c;
  cursor: pointer;
}

.password-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.helper-text {
  font-size: 12px;
  line-height: 1.7;
  color: #788b82;
  margin: 12px 0;
}

.confirmation {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px;
  background: #f5f8f6;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.7;
  margin: 20px 0;
  color: #647770;
}

.confirmation input {
  flex-shrink: 0;
  accent-color: #087b60;
  margin-top: 4px;
}

.info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  border: 1px solid #d6eae0;
  border-radius: 10px;
  background: #edf7f1;
  color: #176746;
  font-size: 13px;
  margin: 18px 0;
}

.info svg {
  flex-shrink: 0;
}

.info p {
  font-size: 12px;
  line-height: 1.7;
  margin: 6px 0 0;
}

.info.warning {
  background: #fffbeb;
  border-color: #f5e6ba;
  color: #926319;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 12px;
  line-height: 1.6;
}

.message svg {
  flex-shrink: 0;
}

.message.error {
  background: #fff0f0;
  color: #a12e2e;
  border: 1px solid #f5cece;
}

.message.success {
  background: #edf7f1;
  color: #176746;
  border: 1px solid #d6eae0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 15px;
  border: 1px solid #d9e5df;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.btn.secondary {
  background: white;
  color: #176746;
}

.btn.primary {
  background: #087b60;
  color: white;
  border-color: #087b60;
}

.btn.primary:hover:not(:disabled) {
  background: #06694f;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.full-button {
  width: 100%;
  min-height: 45px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #edf1ee;
}

@media (max-width: 520px) {
  .modal-header,
  .modal-body {
    padding: 20px;
  }

  .account-summary {
    padding: 12px;
    gap: 9px;
  }

  .account-avatar {
    width: 38px;
    height: 38px;
  }

  .modal-header h2 {
    font-size: 21px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
</style>