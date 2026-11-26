
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { getApiErrorMessage } from "../lib/api";

import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  KeyRound,
  LoaderCircle,
} from "lucide-vue-next";

const router = useRouter();
const auth = useAuthStore();

// ==========================================
// FORM STATE
// ==========================================

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const error = ref("");
const signingOut = ref(false);

const busy = computed(
  () => auth.loading || signingOut.value
);

// ==========================================
// PASSWORD VALIDATION
// ==========================================

const passwordBytes = computed(
  () => new TextEncoder().encode(newPassword.value).length
);

const validLength = computed(
  () =>
    Array.from(newPassword.value).length >= 12 &&
    passwordBytes.value <= 72
);

const validCurrentPassword = computed(
  () =>
    currentPassword.value.length > 0 &&
    new TextEncoder().encode(currentPassword.value).length <= 72
);

const hasUppercase = computed(
  () => /\p{Lu}/u.test(newPassword.value)
);

const hasLowercase = computed(
  () => /\p{Ll}/u.test(newPassword.value)
);

const hasNumber = computed(
  () => /\p{N}/u.test(newPassword.value)
);

const hasSymbol = computed(
  () => /[\p{P}\p{S}]/u.test(newPassword.value)
);

const differentPassword = computed(
  () =>
    newPassword.value.length > 0 &&
    currentPassword.value.length > 0 &&
    newPassword.value !== currentPassword.value
);

const passwordsMatch = computed(
  () =>
    confirmPassword.value.length > 0 &&
    newPassword.value === confirmPassword.value
);

const requirements = computed(() => [
  {
    label: "At least 12 characters",
    valid: validLength.value,
  },
  {
    label: "Uppercase and lowercase letters",
    valid: hasUppercase.value && hasLowercase.value,
  },
  {
    label: "At least one number",
    valid: hasNumber.value,
  },
  {
    label: "At least one special character",
    valid: hasSymbol.value,
  },
  {
    label: "Different from current password",
    valid: differentPassword.value,
  },
  {
    label: "Passwords match",
    valid: passwordsMatch.value,
  },
]);

const canSubmit = computed(
  () =>
    validCurrentPassword.value &&
    requirements.value.every((item) => item.valid) &&
    !busy.value
);

// ==========================================
// PASSWORD STRENGTH INDICATOR
// ==========================================

const strengthScore = computed(() => {
  if (!newPassword.value) return 0;

  return [
    validLength.value,
    hasUppercase.value && hasLowercase.value,
    hasNumber.value,
    hasSymbol.value,
  ].filter(Boolean).length;
});

const strengthLabel = computed(() => {
  if (!newPassword.value) return "Not entered";

  if (strengthScore.value <= 1) return "Weak";
  if (strengthScore.value === 2) return "Fair";
  if (strengthScore.value === 3) return "Good";

  return "Meets complexity rules";
});

const strengthColor = computed(() => {
  if (strengthScore.value <= 1) return "#dc2626";
  if (strengthScore.value === 2) return "#d97706";
  if (strengthScore.value === 3) return "#65a30d";

  return "#059669";
});

// ==========================================
// CHANGE PASSWORD
// ==========================================

async function handleSubmit() {
  error.value = "";

  if (!canSubmit.value) {
    error.value =
      "Please complete all password requirements.";
    return;
  }

  try {
    await auth.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
      confirm_password: confirmPassword.value,
    });

    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";

    await router.replace({
      name: "dashboard",
    });
  } catch (err) {
    error.value = getApiErrorMessage(
      err,
      "Unable to change your password."
    );
  }
}

// ==========================================
// LOGOUT
// ==========================================

async function handleLogout() {
  if (busy.value) return;

  signingOut.value = true;

  try {
    const revoked = await auth.logout();

    if (!revoked) {
      window.alert(
        "You have been signed out locally, but the server could not confirm session revocation."
      );
    }

    await router.replace({
      name: "login",
    });
  } finally {
    signingOut.value = false;
  }
}
</script>

<template>
  <main class="security-page">
    <div class="security-container">

      <!-- ================================= -->
      <!-- LEFT BRANDING PANEL               -->
      <!-- ================================= -->

      <aside class="branding-panel">
        <div class="decoration decoration-one"></div>
        <div class="decoration decoration-two"></div>
        <div class="decoration decoration-three"></div>

        <header class="brand">
          <div class="logo-wrapper">
            <img
              src="/images/logo.png"
              alt="Province of Negros Occidental"
              class="brand-logo"
            />
          </div>

          <div class="brand-text">
            <strong>Province of Negros Occidental</strong>
            <span>JOCOS Payroll Management System</span>
          </div>
        </header>

        <div class="branding-content">
          <div class="branding-label">
            <ShieldCheck :size="15" />
            <span>ACCOUNT SECURITY</span>
          </div>

          <h2>
            Your account.<br />
            Your protection.
          </h2>

          <p class="branding-description">
            Protect your personal information and payroll
            records by keeping your account credentials secure.
          </p>

          <div class="security-features">

            <div class="security-feature">
              <div class="feature-icon">
                <ShieldCheck :size="20" />
              </div>

              <div>
                <strong>Secure authentication</strong>
                <span>
                  Access protected by account credentials.
                </span>
              </div>
            </div>

            <div class="security-feature">
              <div class="feature-icon">
                <LockKeyhole :size="20" />
              </div>

              <div>
                <strong>Account protection</strong>
                <span>
                  Keep your password private and unique.
                </span>
              </div>
            </div>

            <div class="security-feature">
              <div class="feature-icon">
                <UserRound :size="20" />
              </div>

              <div>
                <strong>Authorized access only</strong>
                <span>
                  Access based on your assigned permissions.
                </span>
              </div>
            </div>

          </div>
        </div>

        <footer class="branding-footer">
          <div class="footer-line"></div>

          <strong>JOCOS Payroll 2.0</strong>
          <span>Internal Government System</span>
        </footer>
      </aside>

      <!-- ================================= -->
      <!-- RIGHT FORM PANEL                  -->
      <!-- ================================= -->

      <section class="form-panel">

        <!-- MOBILE BRAND -->

        <header class="mobile-brand">
          <img
            src="/images/logo.png"
            alt="Province of Negros Occidental"
          />

          <div>
            <strong>Province of Negros Occidental</strong>
            <span>JOCOS Payroll Management System</span>
          </div>
        </header>

        <div class="form-content">

          <!-- PAGE HEADING -->

          <div class="form-heading">
            <div class="security-label">
              <KeyRound :size="14" />
              ACCOUNT SECURITY
            </div>

            <h1>
              {{
                auth.mustChangePassword
                  ? "Secure your account."
                  : "Change your password."
              }}
            </h1>

            <p>
              {{
                auth.mustChangePassword
                  ? "Set a new password to continue to your workspace."
                  : "Update your password to keep your account protected."
              }}
            </p>
          </div>

          <!-- MANDATORY PASSWORD NOTICE -->

          <div
            v-if="auth.mustChangePassword"
            class="security-notice"
          >
            <ShieldAlert :size="21" />

            <div>
              <strong>Password change required</strong>

              <p>
                Replace your temporary password before
                accessing the payroll system.
              </p>
            </div>
          </div>

          <!-- SIGNED-IN ACCOUNT -->

          <div class="account-info">
            <div class="account-avatar">
              <UserRound :size="19" />
            </div>

            <div class="account-details">
              <span>Signed in as</span>
              <strong>{{ auth.user?.username }}</strong>
            </div>

            <div class="account-status">
              <span class="status-dot"></span>
              Authenticated
            </div>
          </div>

          <!-- PASSWORD FORM -->

          <form
            class="password-form"
            @submit.prevent="handleSubmit"
          >

            <!-- CURRENT PASSWORD -->

            <div class="field">
              <label for="current-password">
                Current password
              </label>

              <div class="password-wrapper">
                <LockKeyhole
                  :size="17"
                  class="input-icon"
                />

                <input
                  id="current-password"
                  v-model="currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  placeholder="Enter your current password"
                  autocomplete="current-password"
                  maxlength="72"
                  :disabled="busy"
                  required
                />

                <button
                  type="button"
                  class="visibility-toggle"
                  :aria-label="
                    showCurrentPassword
                      ? 'Hide current password'
                      : 'Show current password'
                  "
                  :aria-pressed="showCurrentPassword"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <EyeOff
                    v-if="showCurrentPassword"
                    :size="18"
                  />
                  <Eye v-else :size="18" />
                </button>
              </div>
            </div>

            <!-- NEW PASSWORD -->

            <div class="field">
              <label for="new-password">
                New password
              </label>

              <div class="password-wrapper">
                <KeyRound
                  :size="17"
                  class="input-icon"
                />

                <input
                  id="new-password"
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="Create a new password"
                  autocomplete="new-password"
                  minlength="12"
                  maxlength="72"
                  aria-describedby="password-requirements"
                  :disabled="busy"
                  required
                />

                <button
                  type="button"
                  class="visibility-toggle"
                  :aria-label="
                    showNewPassword
                      ? 'Hide new password'
                      : 'Show new password'
                  "
                  :aria-pressed="showNewPassword"
                  @click="showNewPassword = !showNewPassword"
                >
                  <EyeOff
                    v-if="showNewPassword"
                    :size="18"
                  />
                  <Eye v-else :size="18" />
                </button>
              </div>

              <!-- PASSWORD STRENGTH -->

              <div class="strength-meter">
                <div class="strength-heading">
                  <span>Password complexity</span>

                  <strong
                    :style="{
                      color: newPassword
                        ? strengthColor
                        : '#82918a'
                    }"
                  >
                    {{ strengthLabel }}
                  </strong>
                </div>

                <div
                  class="strength-bars"
                  role="progressbar"
                  aria-label="Password complexity"
                  :aria-valuenow="strengthScore"
                  :aria-valuemin="0"
                  :aria-valuemax="4"
                >
                  <div
                    v-for="index in 4"
                    :key="index"
                    class="strength-bar"
                    :style="{
                      background:
                        index <= strengthScore
                          ? strengthColor
                          : '#e5ebe7'
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- CONFIRM PASSWORD -->

            <div class="field">
              <label for="confirm-password">
                Confirm new password
              </label>

              <div
                class="password-wrapper"
                :class="{
                  'password-matched': passwordsMatch,
                  'password-mismatch':
                    confirmPassword && !passwordsMatch
                }"
              >
                <LockKeyhole
                  :size="17"
                  class="input-icon"
                />

                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Re-enter your new password"
                  autocomplete="new-password"
                  minlength="12"
                  maxlength="72"
                  :disabled="busy"
                  required
                />

                <button
                  type="button"
                  class="visibility-toggle"
                  :aria-label="
                    showConfirmPassword
                      ? 'Hide confirmation password'
                      : 'Show confirmation password'
                  "
                  :aria-pressed="showConfirmPassword"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <EyeOff
                    v-if="showConfirmPassword"
                    :size="18"
                  />
                  <Eye v-else :size="18" />
                </button>
              </div>

              <span
                v-if="confirmPassword && !passwordsMatch"
                class="field-error"
              >
                Passwords do not match.
              </span>
            </div>

            <!-- PASSWORD REQUIREMENTS -->

            <div
              id="password-requirements"
              class="requirements"
            >
              <div class="requirements-heading">
                <ShieldCheck :size="16" />
                <strong>Password requirements</strong>
              </div>

              <div class="requirements-grid">
                <div
                  v-for="requirement in requirements"
                  :key="requirement.label"
                  class="requirement"
                  :class="{ valid: requirement.valid }"
                >
                  <CheckCircle2
                    v-if="requirement.valid"
                    :size="15"
                  />

                  <Circle v-else :size="15" />

                  <span>{{ requirement.label }}</span>
                </div>
              </div>

              <p
                class="byte-limit"
                :class="{ exceeded: passwordBytes > 72 }"
              >
                Maximum password size: 72 bytes.
                {{ passwordBytes }}/72
              </p>
            </div>

            <!-- API ERROR -->

            <div
              v-if="error"
              class="error-message"
              role="alert"
            >
              <ShieldAlert :size="18" />
              <span>{{ error }}</span>
            </div>

            <!-- SUBMIT BUTTON -->

            <button
              type="submit"
              class="submit-button"
              :disabled="!canSubmit"
            >
              <LoaderCircle
                v-if="auth.loading"
                :size="19"
                class="spinner"
              />

              <span>
                {{
                  auth.loading
                    ? "Updating password..."
                    : "Change Password & Continue"
                }}
              </span>

              <ArrowRight
                v-if="!auth.loading"
                :size="18"
                class="submit-arrow"
              />
            </button>
          </form>

          <!-- FOOTER ACTIONS -->

          <div class="footer-actions">
            <RouterLink
              v-if="!auth.mustChangePassword && !busy"
              to="/dashboard"
              class="secondary-action"
            >
              <ArrowLeft :size="16" />
              Back to dashboard
            </RouterLink>

            <button
              type="button"
              class="secondary-action"
              :disabled="busy"
              @click="handleLogout"
            >
              <LoaderCircle
                v-if="signingOut"
                :size="16"
                class="spinner"
              />

              <LogOut v-else :size="16" />

              {{ signingOut ? "Signing out..." : "Sign out" }}
            </button>
          </div>

        </div>
      </section>
    </div>

    <footer class="page-footer">
      <ShieldCheck :size="14" />

      <span>
        Province of Negros Occidental · JOCOS Payroll 2.0
      </span>
    </footer>
  </main>
</template>

<style scoped>
/* ==========================================
   PAGE LAYOUT
========================================== */

.security-page {
  --primary: #087452;
  --primary-dark: #05523b;
  --text: #172e25;
  --muted: #6c7e75;
  --border: #dce6df;

  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;

  background:
    radial-gradient(
      ellipse at top left,
      #dceee3 0%,
      transparent 45%
    ),
    #f3f6f4;
}

.security-page * {
  box-sizing: border-box;
}

.security-container {
  width: 100%;
  max-width: 1140px;
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  overflow: hidden;
  border: 1px solid #dce6df;
  border-radius: 22px;
  background: #ffffff;
  box-shadow:
    0 24px 70px rgba(20, 60, 40, 0.08),
    0 4px 12px rgba(20, 60, 40, 0.03);
}

/* ==========================================
   BRANDING PANEL
========================================== */

.branding-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 36px;
  color: #ffffff;

  background: linear-gradient(
    145deg,
    #0b7253 0%,
    #07523d 50%,
    #033b2c 100%
  );
}

.decoration {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  pointer-events: none;
}

.decoration-one {
  width: 420px;
  height: 420px;
  bottom: -190px;
  right: -210px;
  border: 45px solid rgba(255, 255, 255, 0.045);
}

.decoration-two {
  width: 300px;
  height: 300px;
  bottom: -120px;
  right: -145px;
  border: 1px solid rgba(255, 255, 255, 0.13);
}

.decoration-three {
  width: 250px;
  height: 250px;
  top: -180px;
  left: -80px;
  background: rgba(255, 255, 255, 0.035);
}

/* ==========================================
   OFFICIAL LOGO
========================================== */

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.logo-wrapper {
  width: 62px;
  height: 62px;
  flex-shrink: 0;

  display: grid;
  place-items: center;

  padding: 5px;
  border-radius: 50%;
  background: #ffffff;
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #ffffff;
}

.brand-text span {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: #c1e0d2;
}

/* ==========================================
   BRANDING CONTENT
========================================== */

.branding-content {
  margin: 45px 0;
}

.branding-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.08);

  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #cdeee0;
}

.branding-content h2 {
  margin: 23px 0 16px;
  font-size: clamp(30px, 3vw, 42px);
  font-weight: 750;
  line-height: 1.15;
  letter-spacing: -1.6px;
  color: #ffffff;
}

.branding-description {
  max-width: 340px;
  margin: 0;
  font-size: 13px;
  line-height: 1.85;
  color: #c1ded2;
}

.security-features {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 35px;
}

.security-feature {
  display: flex;
  align-items: center;
  gap: 13px;
}

.feature-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;

  display: grid;
  place-items: center;

  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.08);
  color: #d2eee2;
}

.security-feature strong {
  display: block;
  font-size: 13px;
  font-weight: 650;
  color: #ffffff;
}

.security-feature span {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
  color: #b4d6c8;
}

.footer-line {
  height: 1px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.15);
}

.branding-footer strong {
  display: block;
  font-size: 12px;
  color: #ffffff;
}

.branding-footer span {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #afd1c2;
}

/* ==========================================
   FORM PANEL
========================================== */

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 44px;
  background: #ffffff;
}

.form-content {
  width: 100%;
  max-width: 480px;
}

.mobile-brand {
  display: none;
}

.form-heading {
  margin-bottom: 19px;
}

.security-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--primary);
}

.form-heading h1 {
  margin: 9px 0 7px;
  font-size: clamp(26px, 2.5vw, 32px);
  line-height: 1.2;
  font-weight: 750;
  letter-spacing: -1px;
  color: var(--text);
}

.form-heading p {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
}

/* ==========================================
   SECURITY NOTICE
========================================== */

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 14px;
  margin-bottom: 17px;

  border: 1px solid #f1dfb2;
  border-radius: 10px;
  background: #fffbeb;
  color: #956014;
}

.security-notice > svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.security-notice strong {
  display: block;
  font-size: 12px;
  font-weight: 700;
}

.security-notice p {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.6;
}

/* ==========================================
   ACCOUNT INFORMATION
========================================== */

.account-info {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;
  margin-bottom: 20px;

  border: 1px solid #e3ebe5;
  border-radius: 10px;
  background: #f7faf8;
}

.account-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  display: grid;
  place-items: center;

  border-radius: 9px;
  background: #e5f2e9;
  color: var(--primary);
}

.account-details {
  min-width: 0;
  flex: 1;
}

.account-details span {
  display: block;
  font-size: 10px;
  color: var(--muted);
}

.account-details strong {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--text);
}

.account-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  font-size: 10px;
  font-weight: 600;
  color: var(--primary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

/* ==========================================
   PASSWORD INPUTS
========================================== */

.field {
  margin-bottom: 15px;
}

.field label {
  display: block;
  margin-bottom: 7px;

  font-size: 12px;
  font-weight: 700;
  color: #263b32;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  height: 45px;

  padding: 0 44px 0 40px;

  border: 1px solid var(--border);
  border-radius: 9px;
  outline: none;

  background: #ffffff;
  color: var(--text);
  font: inherit;
  font-size: 13px;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.password-wrapper input::placeholder {
  color: #87988f;
}

.password-wrapper input:focus {
  border-color: #119466;
  box-shadow: 0 0 0 3px rgba(17, 148, 102, 0.1);
}

.password-wrapper input:disabled {
  background: #f5f7f5;
  cursor: not-allowed;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 13px;
  transform: translateY(-50%);
  color: #8a9c92;
  pointer-events: none;
}

.visibility-toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);

  display: grid;
  place-items: center;

  padding: 7px;
  border: 0;
  border-radius: 6px;

  background: transparent;
  color: #7f9187;
  cursor: pointer;
}

.visibility-toggle:hover {
  background: #eef5f0;
  color: var(--primary);
}

.password-matched input {
  border-color: #75c69a;
}

.password-mismatch input {
  border-color: #e9a0a0;
}

.field-error {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #b91c1c;
}

/* ==========================================
   PASSWORD STRENGTH
========================================== */

.strength-meter {
  margin-top: 10px;
}

.strength-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  margin-bottom: 7px;
  font-size: 10px;
  color: var(--muted);
}

.strength-heading strong {
  font-size: 10px;
  font-weight: 700;
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.strength-bar {
  height: 4px;
  border-radius: 8px;
  transition: background 0.25s;
}

/* ==========================================
   PASSWORD REQUIREMENTS
========================================== */

.requirements {
  padding: 13px 14px;
  border: 1px solid #e3ebe5;
  border-radius: 10px;
  background: #f7faf8;
}

.requirements-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 11px;
  color: var(--primary);
}

.requirements-heading strong {
  font-size: 12px;
  color: #263b32;
}

.requirements-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 12px;
  row-gap: 10px;
}

.requirement {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: #718278;
  font-size: 10px;
  line-height: 1.5;
}

.requirement svg {
  flex-shrink: 0;
}

.requirement.valid {
  color: var(--primary);
  font-weight: 600;
}

.byte-limit {
  margin: 10px 0 0;
  padding-top: 9px;
  border-top: 1px solid #e3ebe5;
  font-size: 10px;
  color: #718278;
}

.byte-limit.exceeded {
  color: #b91c1c;
}

/* ==========================================
   ERROR MESSAGE
========================================== */

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 9px;

  margin-top: 13px;
  padding: 12px;

  border: 1px solid #fecaca;
  border-radius: 9px;

  background: #fef2f2;
  color: #b91c1c;

  font-size: 12px;
  line-height: 1.6;
}

.error-message svg {
  flex-shrink: 0;
}

/* ==========================================
   SUBMIT BUTTON
========================================== */

.submit-button {
  position: relative;
  width: 100%;
  min-height: 47px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  margin-top: 19px;
  padding: 12px 36px;

  border: 0;
  border-radius: 9px;

  background: linear-gradient(
    110deg,
    #087452,
    #066247
  );

  color: #ffffff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;

  cursor: pointer;
  box-shadow: 0 4px 12px rgba(8, 116, 82, 0.16);

  transition:
    box-shadow 0.2s,
    transform 0.2s,
    opacity 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(8, 116, 82, 0.24);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.submit-arrow {
  position: absolute;
  right: 15px;
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================
   FOOTER ACTIONS
========================================== */

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
}

.secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 5px;
  border: 0;
  background: transparent;

  color: #65796d;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;

  cursor: pointer;
  transition: color 0.2s;
}

.secondary-action:hover {
  color: var(--primary);
}

.secondary-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:focus-visible,
.secondary-action:focus-visible {
  outline: 2px solid #119466;
  outline-offset: 3px;
}

.page-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  margin-top: 18px;
  color: #72877a;
  font-size: 11px;
  text-align: center;
}

/* ==========================================
   TABLET RESPONSIVENESS
========================================== */

@media (max-width: 1000px) {
  .branding-panel {
    padding: 28px;
  }

  .form-panel {
    padding: 30px;
  }

  .brand-text strong {
    font-size: 12px;
  }

  .brand-text span {
    font-size: 10px;
  }

  .logo-wrapper {
    width: 52px;
    height: 52px;
  }
}

/* ==========================================
   MOBILE RESPONSIVENESS
========================================== */

@media (max-width: 760px) {
  .security-page {
    padding: 22px 16px;
  }

  .security-container {
    display: block;
    max-width: 520px;
    border-radius: 16px;
  }

  .branding-panel {
    display: none;
  }

  .form-panel {
    display: block;
    padding: 26px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 11px;

    margin-bottom: 26px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5ebe7;
  }

  .mobile-brand img {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    object-fit: contain;
  }

  .mobile-brand strong {
    display: block;
    font-size: 12px;
    color: var(--text);
  }

  .mobile-brand span {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    color: var(--muted);
  }

  .form-content {
    max-width: none;
  }

  .password-wrapper input {
    font-size: 16px;
  }
}

@media (max-width: 400px) {
  .security-page {
    padding: 14px 10px;
  }

  .form-panel {
    padding: 21px 18px;
  }

  .requirements-grid {
    grid-template-columns: 1fr;
  }

  .account-status {
    display: none;
  }

  .page-footer {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .password-wrapper input,
  .submit-button,
  .strength-bar,
  .secondary-action {
    transition: none;
  }

  .spinner {
    animation: none;
  }
}
</style>
