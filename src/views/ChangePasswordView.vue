<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

import axios from "axios";

import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Landmark,
  LockKeyhole,
  LogOut,
  ShieldAlert,
  ShieldCheck,
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

// ==========================================
// VALIDATION
// ==========================================

const validLength = computed(
  () =>
    newPassword.value.length >= 12 &&
    newPassword.value.length <= 128
);

const differentPassword = computed(
  () =>
    Boolean(newPassword.value.trim()) &&
    newPassword.value !== currentPassword.value
);

const passwordsMatch = computed(
  () =>
    Boolean(confirmPassword.value) &&
    newPassword.value === confirmPassword.value
);

const canSubmit = computed(
  () =>
    Boolean(currentPassword.value) &&
    validLength.value &&
    differentPassword.value &&
    passwordsMatch.value &&
    !auth.loading &&
    !signingOut.value
);

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
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        error.value = detail;
      } else if (typeof detail?.message === "string") {
        error.value = detail.message;
      } else {
        error.value =
          "Unable to change your password.";
      }
    } else if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value =
        "Unable to change your password.";
    }
  }
}

// ==========================================
// LOGOUT
// ==========================================

async function handleLogout() {
  if (signingOut.value || auth.loading) return;

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

    <!-- BRAND -->

    <header class="brand">
      <div class="brand-icon">
        <Landmark :size="25" />
      </div>

      <div>
        <strong>
          Province of Negros Occidental
        </strong>

        <span>
          JOCOS Payroll Management System
        </span>
      </div>
    </header>

    <!-- SECURITY CARD -->

    <section class="security-card">

      <div class="card-heading">
        <div class="security-icon">
          <ShieldCheck :size="30" />
        </div>

        <span class="eyebrow">
          ACCOUNT SECURITY
        </span>

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
              ? "Change your temporary password before accessing the payroll system."
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
          <strong>
            Password change required
          </strong>

          <p>
            Your administrator has issued a
            temporary password. Create a new
            password that only you know.
          </p>
        </div>
      </div>

      <!-- ACCOUNT -->

      <div class="account-info">
        <LockKeyhole :size="17" />

        <span>Signed in as</span>

        <strong>
          {{ auth.user?.username }}
        </strong>
      </div>

      <!-- FORM -->

      <form @submit.prevent="handleSubmit">

        <!-- CURRENT PASSWORD -->

        <div class="field">
          <label for="current-password">
            Current password
          </label>

          <div class="password-wrapper">
            <input
              id="current-password"
              v-model="currentPassword"
              :type="
                showCurrentPassword
                  ? 'text'
                  : 'password'
              "
              placeholder="Enter current password"
              autocomplete="current-password"
              maxlength="128"
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
              @click="
                showCurrentPassword =
                  !showCurrentPassword
              "
            >
              <EyeOff
                v-if="showCurrentPassword"
                :size="19"
              />

              <Eye v-else :size="19" />
            </button>
          </div>
        </div>

        <!-- NEW PASSWORD -->

        <div class="field">
          <label for="new-password">
            New password
          </label>

          <div class="password-wrapper">
            <input
              id="new-password"
              v-model="newPassword"
              :type="
                showNewPassword
                  ? 'text'
                  : 'password'
              "
              placeholder="Create a new password"
              autocomplete="new-password"
              minlength="12"
              maxlength="128"
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
              @click="
                showNewPassword = !showNewPassword
              "
            >
              <EyeOff
                v-if="showNewPassword"
                :size="19"
              />

              <Eye v-else :size="19" />
            </button>
          </div>
        </div>

        <!-- CONFIRM PASSWORD -->

        <div class="field">
          <label for="confirm-password">
            Confirm new password
          </label>

          <div class="password-wrapper">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="
                showConfirmPassword
                  ? 'text'
                  : 'password'
              "
              placeholder="Re-enter new password"
              autocomplete="new-password"
              minlength="12"
              maxlength="128"
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
              @click="
                showConfirmPassword =
                  !showConfirmPassword
              "
            >
              <EyeOff
                v-if="showConfirmPassword"
                :size="19"
              />

              <Eye v-else :size="19" />
            </button>
          </div>
        </div>

        <!-- REQUIREMENTS -->

        <div class="requirements">
          <strong>
            Password requirements
          </strong>

          <div
            class="requirement"
            :class="{ valid: validLength }"
          >
            <CheckCircle2
              v-if="validLength"
              :size="16"
            />

            <Circle v-else :size="16" />

            <span>12 to 128 characters</span>
          </div>

          <div
            class="requirement"
            :class="{ valid: differentPassword }"
          >
            <CheckCircle2
              v-if="differentPassword"
              :size="16"
            />

            <Circle v-else :size="16" />

            <span>
              Different from your current password
            </span>
          </div>

          <div
            class="requirement"
            :class="{ valid: passwordsMatch }"
          >
            <CheckCircle2
              v-if="passwordsMatch"
              :size="16"
            />

            <Circle v-else :size="16" />

            <span>New passwords must match</span>
          </div>
        </div>

        <!-- ERROR -->

        <div
          v-if="error"
          class="error-message"
          role="alert"
        >
          <ShieldAlert :size="18" />
          <span>{{ error }}</span>
        </div>

        <!-- SUBMIT -->

        <button
          type="submit"
          class="submit-button"
          :disabled="!canSubmit"
        >
          <span>
            {{
              auth.loading
                ? "Updating password..."
                : "Change Password & Continue"
            }}
          </span>

          <ArrowRight :size="19" />
        </button>
      </form>

      <!-- ACTIONS -->

      <div class="footer-actions">

        <RouterLink
          v-if="!auth.mustChangePassword"
          to="/dashboard"
          class="secondary-action"
        >
          <ArrowLeft :size="17" />
          Back to dashboard
        </RouterLink>

        <button
          type="button"
          class="secondary-action"
          :disabled="
            signingOut || auth.loading
          "
          @click="handleLogout"
        >
          <LogOut :size="17" />

          {{
            signingOut
              ? "Signing out..."
              : "Sign out"
          }}
        </button>

      </div>
    </section>

    <footer class="page-footer">
      <ShieldCheck :size="15" />

      <span>
        JOCOS Payroll 2.0 · Internal Government System
      </span>
    </footer>

  </main>
</template>

<style scoped>
.security-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background:
    radial-gradient(
      circle at 10% 0%,
      #d9eee2,
      transparent 35%
    ),
    #f5f8f6;
}

.security-page * {
  box-sizing: border-box;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 28px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: white;
  background: #087452;
}

.brand strong {
  display: block;
  font-size: 14px;
  color: #17392c;
}

.brand span {
  display: block;
  font-size: 12px;
  color: #788780;
  margin-top: 5px;
}

.security-card {
  width: 100%;
  max-width: 510px;
  padding: 36px;
  border: 1px solid #dce7e1;
  border-radius: 20px;
  background: white;
  box-shadow: 0 12px 45px #123e2c0a;
}

.card-heading {
  text-align: center;
  margin-bottom: 25px;
}

.security-icon {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #e7f6ed;
  color: #087452;
  margin: 0 auto 20px;
}

.eyebrow {
  color: #087452;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
}

.card-heading h1 {
  color: #132b26;
  font-size: 30px;
  letter-spacing: -1px;
  margin: 10px 0;
}

.card-heading p {
  color: #788780;
  font-size: 13px;
  line-height: 1.8;
  margin: 0;
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  margin-bottom: 22px;
  background: #fffbeb;
  border: 1px solid #f5e6ba;
  border-radius: 10px;
  color: #a16a13;
}

.security-notice > svg {
  flex-shrink: 0;
}

.security-notice strong {
  font-size: 13px;
}

.security-notice p {
  font-size: 12px;
  line-height: 1.7;
  margin: 5px 0 0;
}

.account-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #788780;
  font-size: 12px;
  margin-bottom: 24px;
}

.account-info strong {
  color: #17392c;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #263b34;
  margin-bottom: 9px;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  height: 51px;
  padding: 0 48px 0 15px;
  border: 1px solid #dce7e1;
  border-radius: 10px;
  outline: none;
  background: white;
  color: #17392c;
  font: inherit;
  font-size: 14px;
  transition:
    border-color .2s,
    box-shadow .2s;
}

.password-wrapper input:focus {
  border-color: #119466;
  box-shadow: 0 0 0 3px #1194661c;
}

.password-wrapper input::placeholder {
  color: #9aa9a2;
}

.visibility-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  border: 0;
  padding: 6px;
  color: #91a19a;
  background: transparent;
  cursor: pointer;
}

.requirements {
  padding: 16px;
  background: #f5f8f6;
  border: 1px solid #e6eee9;
  border-radius: 10px;
}

.requirements > strong {
  display: block;
  font-size: 12px;
  color: #263b34;
  margin-bottom: 13px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #819189;
  font-size: 12px;
  margin-top: 9px;
}

.requirement.valid {
  color: #087452;
}

.requirement svg {
  flex-shrink: 0;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 13px;
  margin-top: 18px;
  border-radius: 9px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
  line-height: 1.6;
}

.error-message svg {
  flex-shrink: 0;
}

.submit-button {
  width: 100%;
  min-height: 53px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: #087452;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.submit-button:hover:not(:disabled) {
  background: #065d42;
}

.submit-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 23px;
}

.secondary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px;
  border: 0;
  background: transparent;
  color: #647770;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.secondary-action:hover {
  color: #087452;
}

.secondary-action:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.page-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 26px;
  color: #819189;
  font-size: 11px;
  text-align: center;
}

@media (max-width: 520px) {
  .security-page {
    padding: 24px 15px;
  }

  .security-card {
    padding: 25px 20px;
    border-radius: 15px;
  }

  .card-heading h1 {
    font-size: 26px;
  }

  .brand strong {
    font-size: 12px;
  }

  .brand span {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .password-wrapper input,
  .submit-button {
    transition: none;
  }
}
</style>