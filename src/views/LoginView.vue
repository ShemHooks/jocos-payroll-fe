<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

import axios from "axios";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Landmark,
  LockKeyhole,
  ShieldCheck,
} from "lucide-vue-next";

const router = useRouter();
const auth = useAuthStore();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");

async function handleLogin() {
  if (auth.loading) return;

  error.value = "";

  if (!username.value.trim() || !password.value) {
    error.value =
      "Please enter your username and password.";

    return;
  }

  try {
    const currentUser = await auth.login(
      username.value.trim(),
      password.value
    );

    password.value = "";

    if (currentUser.must_change_password) {
      await router.replace({
        name: "change-password",
      });

      return;
    }

    await router.replace({
      name: "dashboard",
    });
  } catch (err) {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401
    ) {
      error.value =
        "Invalid username or password.";
    } else {
      error.value =
        "Unable to sign in. Please try again.";
    }
  }
}
</script>

<template>
  <main class="login-layout">
    <section class="login-showcase">
      <RouterLink to="/" class="showcase-brand">
        <div class="showcase-logo"><Landmark :size="24" /></div>
        <div>
          <strong>Province of Negros Occidental</strong>
          <span>JOCOS Payroll Management System</span>
        </div>
      </RouterLink>

      <div class="showcase-content">
        <span class="showcase-badge">
          <LockKeyhole :size="15" /> SECURE STAFF PORTAL
        </span>

        <h1>
          Payroll management,
          <span>made more efficient.</span>
        </h1>

        <p>
          One secure workspace for employee records,
          payroll preparation, approval workflows,
          and official payroll documentation.
        </p>
      </div>

      <div class="showcase-footer">
        <div class="showcase-footer-icon">
          <ShieldCheck :size="23" />
        </div>
        <div>
          <strong>Authorized access only</strong>
          <span>Protected by role-based access controls.</span>
        </div>
      </div>

      <div class="showcase-circle circle-one"></div>
      <div class="showcase-circle circle-two"></div>
    </section>

    <section class="login-panel">
      <div class="panel-top">
        <RouterLink to="/" class="back-link">
          <ArrowLeft :size="17" /> Back to home
        </RouterLink>

        <span class="portal-label">JOCOS PAYROLL 2.0</span>
      </div>

      <div class="form-container">
        <div class="form-icon">
          <LockKeyhole :size="24" />
        </div>

        <div class="form-heading">
          <span>SECURE ACCOUNT ACCESS</span>
          <h2>Welcome back.</h2>
          <p>
            Enter your credentials to access the
            JOCOS Payroll Management System.
          </p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="field">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Enter your username"
              autocomplete="username"
              maxlength="120"
              required
            />
          </div>

          <div class="field">
            <label for="password">Password</label>

            <div class="password-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
              />

              <button
                type="button"
                class="visibility-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="19" />
                <Eye v-else :size="19" />
              </button>
            </div>
          </div>

          <p v-if="error" class="error-message" role="alert">
            {{ error }}
          </p>

          <button class="submit-button" type="submit" :disabled="auth.loading">
            <span>{{ auth.loading ? "Signing in..." : "Sign in to workspace" }}</span>
            <ArrowRight :size="19" />
          </button>
        </form>

        <div class="security-note">
          <ShieldCheck :size="17" />
          <span>Your account is managed by the system administrator.</span>
        </div>
      </div>

      <div class="panel-footer">
        <span>JOCOS Payroll 2.0</span>
        <span>Internal Government System</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 46% 54%;
  background: #fbfcfb;
}

.login-showcase {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 46px clamp(32px, 5vw, 85px);
  color: white;
  background:
    radial-gradient(circle at 90% 75%, #15946755, transparent 45%),
    linear-gradient(145deg, #06312e, #075644);
}

.showcase-brand,
.showcase-content,
.showcase-footer {
  position: relative;
  z-index: 2;
}

.showcase-brand {
  display: flex;
  align-items: center;
  gap: 13px;
  color: white;
  text-decoration: none;
}

.showcase-logo {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #ffffff18;
  border: 1px solid #ffffff30;
}

.showcase-brand strong,
.showcase-brand span,
.showcase-footer strong,
.showcase-footer span {
  display: block;
}

.showcase-brand strong { font-size: 14px; }
.showcase-brand span { font-size: 12px; color: #acd1c5; margin-top: 5px; }

.showcase-content { max-width: 600px; }

.showcase-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #ffffff12;
  border: 1px solid #ffffff30;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

.showcase-content h1 {
  font-size: clamp(42px, 4.1vw, 69px);
  line-height: 1.12;
  letter-spacing: -2.5px;
  margin: 28px 0;
}

.showcase-content h1 span { color: #9de8b9; }

.showcase-content p {
  max-width: 490px;
  font-size: 16px;
  line-height: 1.9;
  color: #c2ded4;
}

.showcase-footer {
  display: flex;
  align-items: center;
  gap: 14px;
}

.showcase-footer-icon {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  background: #ffffff18;
  border-radius: 12px;
}

.showcase-footer strong { font-size: 13px; }
.showcase-footer span { color: #a8cfc1; font-size: 12px; margin-top: 5px; }

.showcase-circle {
  position: absolute;
  width: 750px;
  height: 750px;
  border: 1px solid #ffffff15;
  border-radius: 50%;
  right: -380px;
  top: 50%;
  transform: translateY(-50%);
}

.circle-two { width: 1000px; height: 1000px; right: -510px; }

.login-panel {
  display: flex;
  flex-direction: column;
  padding: 44px clamp(30px, 6vw, 100px) 30px;
}

.panel-top,
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #647770;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.back-link:hover { color: #087452; }

.portal-label {
  color: #94a49d;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.form-container {
  width: 100%;
  max-width: 470px;
  margin: auto;
  padding: 70px 0;
}

.form-icon {
  width: 53px;
  height: 53px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: #e7f6ed;
  color: #087452;
  margin-bottom: 29px;
}

.form-heading > span {
  font-size: 11px;
  color: #087452;
  font-weight: 800;
  letter-spacing: 2px;
}

.form-heading h2 {
  font-size: clamp(34px, 3vw, 44px);
  letter-spacing: -1.5px;
  margin: 13px 0;
  color: #132b26;
}

.form-heading p {
  font-size: 14px;
  color: #788780;
  line-height: 1.8;
  margin-bottom: 35px;
}

.field { margin-bottom: 22px; }

.field label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #263b34;
}

.field input {
  width: 100%;
  height: 54px;
  padding: 0 16px;
  border: 1px solid #dce7e1;
  border-radius: 10px;
  outline: none;
  font: inherit;
  font-size: 14px;
  color: #17392c;
  background: white;
  transition: border-color .2s, box-shadow .2s;
}

.field input:focus {
  border-color: #119466;
  box-shadow: 0 0 0 3px #1194661c;
}

.field input::placeholder { color: #9aa9a2; }

.password-wrapper { position: relative; }
.password-wrapper input { padding-right: 52px; }

.visibility-toggle {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #91a19a;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 6px;
}

.submit-button {
  width: 100%;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  border: 0;
  border-radius: 10px;
  background: #087452;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.submit-button:hover { background: #065d42; }
.submit-button:disabled { opacity: .65; cursor: not-allowed; }

.error-message {
  color: #b91c1c;
  font-size: 13px;
  margin: 8px 0;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 28px;
  color: #819189;
  font-size: 12px;
  text-align: center;
}

.panel-footer {
  color: #9ba9a1;
  font-size: 11px;
  border-top: 1px solid #edf1ee;
  padding-top: 23px;
}

@media (max-width: 900px) {
  .login-layout { grid-template-columns: 1fr; }
  .login-showcase { min-height: 320px; padding: 30px; }
  .showcase-content { margin: 55px 0; }
  .showcase-content h1 { font-size: 38px; }
  .showcase-footer { display: none; }
  .login-panel { min-height: 600px; }
}

@media (max-width: 500px) {
  .login-showcase { min-height: 270px; }
  .showcase-content { margin: 30px 0; }
  .showcase-content h1 { font-size: 30px; letter-spacing: -1px; }
  .showcase-content p { font-size: 13px; }
  .login-panel { padding: 25px; }
  .form-container { padding: 55px 0; }
  .portal-label { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .field input,
  .submit-button { transition: none; }
}
</style>