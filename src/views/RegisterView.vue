<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-vue-next";
</script>

<template>
  <main class="register-layout">
    <section class="register-visual">
      <RouterLink to="/" class="visual-brand">
        <img
          src="/images/logo.png"
          alt="Province of Negros Occidental seal"
        />
        <div>
          <strong>Province of Negros Occidental</strong>
          <span>JOCOS Payroll Management System</span>
        </div>
      </RouterLink>

      <div class="visual-copy">
        <span class="visual-label">
          <ShieldCheck :size="16" />
          SECURE STAFF ACCESS
        </span>

        <h1>
          One workspace.
          <span>Controlled access.</span>
        </h1>

        <p>
          JOCOS Payroll 2.0 is designed for authorized
          provincial government personnel involved in
          employee administration and payroll operations.
        </p>
      </div>
    </section>

    <section class="register-panel">
      <RouterLink to="/" class="back-link">
        <ArrowLeft :size="18" />
        Back to home
      </RouterLink>

      <div class="register-content">
        <div class="register-icon">
          <UserRoundPlus :size="28" />
        </div>

        <span class="eyebrow">ACCOUNT REGISTRATION</span>

        <h2>Request system access.</h2>

        <p class="description">
          Accounts are currently created and managed
          by the JOCOS system administrator.
        </p>

        <div class="notice">
          <LockKeyhole :size="22" />

          <div>
            <strong>Administrator approval required</strong>
            <p>
              Please contact your designated system administrator
              to request a user account and the appropriate
              access permissions.
            </p>
          </div>
        </div>

        <RouterLink to="/login" class="login-button">
          Already have an account? Sign In
          <ArrowRight :size="18" />
        </RouterLink>
      </div>

      <div class="panel-footer">
        JOCOS Payroll 2.0 · Internal Government System
      </div>
    </section>
  </main>
</template>

<style scoped>
.register-layout {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 46% 54%;
  background: #fbfcfb;
}

.register-visual {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 46px clamp(30px, 5vw, 85px);
  color: white;
  background:
    linear-gradient(
      135deg,
      rgba(3, 40, 34, 0.94),
      rgba(4, 71, 52, 0.75)
    ),
    url("/images/capitol.jpg") center / cover no-repeat;
}

.visual-brand {
  display: flex;
  align-items: center;
  gap: 13px;
  color: white;
  text-decoration: none;
}

.visual-brand img {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.visual-brand strong,
.visual-brand span {
  display: block;
}

.visual-brand strong {
  font-size: 14px;
}

.visual-brand span {
  margin-top: 5px;
  font-size: 12px;
  color: #c0dfd0;
}

.visual-copy {
  max-width: 550px;
  margin: auto 0;
}

.visual-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 15px;
  border: 1px solid #ffffff45;
  border-radius: 100px;
  background: #ffffff13;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 1px;
}

.visual-copy h1 {
  margin: 27px 0;
  font-size: clamp(42px, 4vw, 68px);
  line-height: 1.12;
  letter-spacing: -2.5px;
}

.visual-copy h1 span {
  display: block;
  color: #a7efbf;
}

.visual-copy p {
  color: #c9e2d7;
  font-size: 15px;
  line-height: 1.9;
}

.register-panel {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  padding: 45px clamp(30px, 6vw, 100px) 30px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-start;
  color: #64776e;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}

.register-content {
  width: 100%;
  max-width: 490px;
  margin: auto;
  padding: 60px 0;
}

.register-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: #087452;
  background: #e6f5ec;
  margin-bottom: 29px;
}

.eyebrow {
  color: #087452;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.register-content h2 {
  margin: 15px 0;
  font-size: clamp(32px, 3vw, 43px);
  letter-spacing: -1.5px;
  color: #142a25;
}

.description {
  color: #718278;
  font-size: 14px;
  line-height: 1.85;
}

.notice {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 23px;
  margin-top: 32px;
  border: 1px solid #d9eae0;
  border-radius: 13px;
  background: #f3f9f5;
  color: #087452;
}

.notice > svg {
  flex-shrink: 0;
}

.notice strong {
  display: block;
  font-size: 14px;
  color: #173b2b;
}

.notice p {
  margin: 9px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: #637b6c;
}

.login-button {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
  padding: 15px;
  border-radius: 10px;
  background: #087452;
  color: white;
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.login-button:hover {
  background: #065e42;
}

.panel-footer {
  padding-top: 22px;
  border-top: 1px solid #e8efeb;
  color: #95a59b;
  font-size: 11px;
}

@media (max-width: 900px) {
  .register-layout {
    grid-template-columns: 1fr;
  }

  .register-visual {
    min-height: 340px;
    padding: 30px;
  }

  .visual-copy {
    margin: 50px 0;
  }

  .visual-copy h1 {
    font-size: 38px;
  }

  .register-panel {
    min-height: 550px;
    padding: 30px;
  }
}

@media (max-width: 500px) {
  .visual-copy h1 {
    font-size: 32px;
    letter-spacing: -1px;
  }

  .register-content {
    padding: 65px 0;
  }
}
</style>