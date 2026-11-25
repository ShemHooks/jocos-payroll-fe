
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Fingerprint,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Users,
  Wallet,
  X,
  ChevronDown,
  Building2,
  BadgeCheck,
} from "lucide-vue-next";

const menuOpen = ref(false);
const isScrolled = ref(false);

function handleScroll() {
  isScrolled.value = window.scrollY > 40;
}

function closeMenu() {
  menuOpen.value = false;
}

onMounted(() => {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

const features = [
  {
    icon: Users,
    number: "01",
    title: "Employee Management",
    description:
      "Centralized employee profiles, departments, positions, employment contracts, and personnel records for JO/COS workers.",
  },
  {
    icon: Calculator,
    number: "02",
    title: "Payroll Processing",
    description:
      "Structured payroll preparation, salary computation, deductions, adjustments, and payroll period management.",
  },
  {
    icon: Wallet,
    number: "03",
    title: "Special Compensation",
    description:
      "Dedicated workflows for EPEP, HEA, PhilHealth sharing, gratuity, and other compensation programs.",
  },
  {
    icon: ClipboardCheck,
    number: "04",
    title: "Review & Approval",
    description:
      "Controlled review, verification, and approval of payroll records by authorized personnel.",
  },
  {
    icon: FileText,
    number: "05",
    title: "Reports & Printing",
    description:
      "Generate payroll registers, payslips, vouchers, tax reports, summaries, and official payroll documents.",
  },
  {
    icon: ShieldCheck,
    number: "06",
    title: "Security & Access Control",
    description:
      "Role-based permissions and accountable workflows designed to protect sensitive payroll information.",
  },
];

const steps = [
  {
    number: "01",
    title: "Manage Personnel",
    description:
      "Organize employee information, employment contracts, departments, and assignments.",
  },
  {
    number: "02",
    title: "Prepare Payroll",
    description:
      "Process salary information, deductions, adjustments, and applicable compensation.",
  },
  {
    number: "03",
    title: "Review & Approve",
    description:
      "Verify payroll details through controlled review and authorization workflows.",
  },
  {
    number: "04",
    title: "Generate Documents",
    description:
      "Prepare payroll reports, official printouts, and treasury export files.",
  },
];
</script>

<template>
  <div class="landing">
    <!-- NAVBAR -->
    <header
      class="site-header"
      :class="{ scrolled: isScrolled, 'menu-open': menuOpen }"
    >
      <div class="nav-container">
        <RouterLink to="/" class="brand" @click="closeMenu">
          <img
            src="/images/logo.png"
            alt="Province of Negros Occidental seal"
            class="brand-logo"
          />

          <div class="brand-copy">
            <strong>Province of Negros Occidental</strong>
            <span>JOCOS Payroll Management System</span>
          </div>
        </RouterLink>

        <nav
          id="primary-navigation"
          class="main-nav"
          :class="{ open: menuOpen }"
          aria-label="Main navigation"
        >
          <a href="#home" @click="closeMenu">Home</a>
          <a href="#about" @click="closeMenu">About</a>
          <a href="#features" @click="closeMenu">Features</a>
          <a href="#workflow" @click="closeMenu">How It Works</a>

          <div class="mobile-nav-actions">
            <RouterLink to="/login" @click="closeMenu">
              Sign In
            </RouterLink>
            <RouterLink to="/register" @click="closeMenu">
              Register
            </RouterLink>
          </div>
        </nav>

        <div class="nav-actions">
          <RouterLink to="/login" class="nav-signin">
            Sign In
          </RouterLink>

          <RouterLink to="/register" class="nav-register">
            Register
            <ArrowUpRight :size="16" />
          </RouterLink>

          <button
            type="button"
            class="mobile-menu"
            :aria-expanded="menuOpen"
            aria-controls="primary-navigation"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            @click="menuOpen = !menuOpen"
          >
            <X v-if="menuOpen" :size="22" />
            <Menu v-else :size="22" />
          </button>
        </div>
      </div>
    </header>

    <main>
      <!-- HERO -->
      <section id="home" class="hero">
        <div class="hero-photo"></div>
        <div class="hero-shade"></div>
        <div class="hero-accent"></div>

        <div class="hero-container">
          <div class="hero-content">
            <div class="hero-eyebrow">
              <span class="eyebrow-dot"></span>
              PROVINCIAL GOVERNMENT OF NEGROS OCCIDENTAL
            </div>

            <p class="hero-overline">
              JO/COS PAYROLL MANAGEMENT SYSTEM
              <span class="overline-divider"></span>
              VERSION 2.0
            </p>

            <h1>
              Modernizing payroll.
              <span>Empowering public service.</span>
            </h1>

            <p class="hero-description">
              A modern, centralized payroll management platform
              designed to support the efficient administration
              of Job Order (JO) and Contract of Service (COS)
              personnel of the Province of Negros Occidental.
            </p>

            <div class="hero-actions">
              <RouterLink to="/login" class="hero-primary">
                Access the System
                <ArrowRight :size="19" />
              </RouterLink>

              <RouterLink to="/register" class="hero-secondary">
                Request an Account
                <ArrowUpRight :size="18" />
              </RouterLink>
            </div>

            <div class="hero-security">
              <div>
                <LockKeyhole :size="16" />
                <span>Authorized Personnel</span>
              </div>

              <span class="security-separator"></span>

              <div>
                <Fingerprint :size="16" />
                <span>Role-Based Access</span>
              </div>

              <span class="security-separator"></span>

              <div>
                <ShieldCheck :size="16" />
                <span>Secure Workflows</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-side-text">
          PROVINCE OF NEGROS OCCIDENTAL
        </div>

        <a href="#about" class="scroll-prompt">
          <span>SCROLL TO EXPLORE</span>
          <ChevronDown :size="18" />
        </a>

        <div class="hero-bottom-accent"></div>
      </section>

      <!-- ABOUT -->
      <section id="about" class="about-section">
        <div class="section-container about-grid">
          <div class="about-heading">
            <div class="section-label">
              <span class="label-line"></span>
              ABOUT THE PLATFORM
            </div>

            <h2>
              Built for the people
              <span>behind public service.</span>
            </h2>
          </div>

          <div class="about-content">
            <p>
              JOCOS Payroll 2.0 is a payroll modernization initiative
              designed to support the management of Job Order and
              Contract of Service personnel within the Provincial
              Government of Negros Occidental.
            </p>

            <p>
              The platform aims to bring employee records, payroll
              computations, approval workflows, treasury preparation,
              and official documentation into one coordinated
              and accessible system.
            </p>

            <div class="about-highlight">
              <div class="highlight-icon">
                <BadgeCheck :size="21" />
              </div>

              <div>
                <strong>Designed for accountable operations</strong>
                <span>
                  Structured workflows, clear responsibilities,
                  and secure access to payroll information.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section id="features" class="features-section">
        <div class="section-container">
          <div class="section-intro">
            <div class="section-label">
              <span class="label-line"></span>
              PLATFORM CAPABILITIES
            </div>

            <h2>
              One connected platform.
              <span>Every payroll workflow.</span>
            </h2>

            <p>
              A comprehensive set of planned capabilities
              supporting the JO/COS payroll lifecycle,
              from employee administration to official reporting.
            </p>
          </div>

          <div class="features-grid">
            <article
              v-for="feature in features"
              :key="feature.number"
              class="feature-card"
            >
              <div class="feature-card-top">
                <div class="feature-icon">
                  <component :is="feature.icon" :size="24" />
                </div>

                <span class="feature-number">
                  {{ feature.number }}
                </span>
              </div>

              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>

              <div class="feature-bottom-line"></div>
            </article>
          </div>
        </div>
      </section>

      <!-- WORKFLOW -->
      <section id="workflow" class="workflow-section">
        <div class="section-container">
          <div class="section-intro">
            <div class="section-label">
              <span class="label-line"></span>
              HOW IT WORKS
            </div>

            <h2>
              A simpler way to manage
              <span>the payroll lifecycle.</span>
            </h2>

            <p>
              A structured process designed to make
              payroll preparation, verification,
              and documentation more organized.
            </p>
          </div>

          <div class="workflow-grid">
            <article
              v-for="(step, index) in steps"
              :key="step.number"
              class="workflow-step"
            >
              <div class="step-top">
                <span class="step-number">
                  {{ step.number }}
                </span>

                <ArrowRight
                  v-if="index < steps.length - 1"
                  :size="20"
                  class="step-arrow"
                />
                <CheckCircle2
                  v-else
                  :size="21"
                  class="step-arrow"
                />
              </div>

              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ACCESS CTA -->
      <section class="access-section">
        <div class="section-container access-inner">
          <div class="access-copy">
            <div class="access-label">
              <LockKeyhole :size="16" />
              SECURE STAFF ACCESS
            </div>

            <h2>
              Your payroll workspace
              <span>starts here.</span>
            </h2>

            <p>
              Access JOCOS Payroll 2.0 with your
              authorized account, or request access
              through your system administrator.
            </p>
          </div>

          <div class="access-actions">
            <RouterLink to="/login" class="access-primary">
              Staff Sign In
              <ArrowRight :size="18" />
            </RouterLink>

            <RouterLink to="/register" class="access-secondary">
              Register / Request Access
              <ArrowUpRight :size="17" />
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <!-- FOOTER -->
    <footer class="site-footer">
      <div class="section-container footer-inner">
        <div class="footer-brand">
          <img
            src="/images/logo.png"
            alt="Province of Negros Occidental seal"
          />

          <div>
            <strong>JOCOS Payroll 2.0</strong>
            <span>Province of Negros Occidental</span>
          </div>
        </div>

        <div class="footer-info">
          <span>Internal Payroll Management System</span>
          <span>For authorized government personnel</span>
        </div>
      </div>

      <div class="section-container footer-bottom">
        <span>Provincial Government of Negros Occidental</span>
        <span>JOCOS Payroll Management System</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  --green: #087452;
  --green-light: #9de8b9;
  --deep: #052e2a;
  --ink: #142a25;
  --muted: #697a73;

  color: var(--ink);
  overflow-x: clip;
}

/* ======================================
   NAVBAR
====================================== */

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 92px;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  transition:
    height 0.3s ease,
    background 0.3s ease,
    box-shadow 0.3s ease;
}

.site-header.scrolled,
.site-header.menu-open {
  height: 78px;
  background: rgba(3, 41, 34, 0.95);
  border-bottom-color: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.nav-container {
  width: min(100% - 80px, 1450px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  color: white;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo {
  width: 57px;
  height: 57px;
  object-fit: contain;
  transition: width 0.3s, height 0.3s;
}

.site-header.scrolled .brand-logo {
  width: 48px;
  height: 48px;
}

.brand-copy strong,
.brand-copy span {
  display: block;
}

.brand-copy strong {
  font-size: 14px;
  font-weight: 750;
  letter-spacing: -0.2px;
}

.brand-copy span {
  font-size: 11px;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.72);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: clamp(18px, 2.2vw, 38px);
}

.main-nav > a {
  position: relative;
  padding: 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.83);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.main-nav > a:hover {
  color: white;
}

.main-nav > a::after {
  content: "";
  position: absolute;
  bottom: 5px;
  left: 0;
  width: 0;
  height: 2px;
  background: #9de8b9;
  transition: width 0.25s ease;
}

.main-nav > a:hover::after {
  width: 100%;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.nav-signin {
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 650;
  padding: 12px 14px;
}

.nav-signin:hover {
  color: #a7efbf;
}

.nav-register {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 9px;
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  transition: background 0.2s ease;
}

.nav-register:hover {
  background: rgba(255, 255, 255, 0.22);
}

.mobile-menu,
.mobile-nav-actions {
  display: none;
}

/* ======================================
   HERO
====================================== */

.hero {
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 145px 0 110px;
  color: white;
  background: #052e2a;
}

.hero-photo,
.hero-shade,
.hero-accent {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-photo {
  z-index: -3;
  background-image: url("/images/capitol.jpg");
  background-size: cover;
  background-position: center 52%;
  background-repeat: no-repeat;
  transform: scale(1.025);
}

.hero-shade {
  z-index: -2;
  background:
    linear-gradient(
      90deg,
      rgba(2, 28, 25, 0.96) 0%,
      rgba(3, 40, 34, 0.91) 34%,
      rgba(3, 45, 37, 0.67) 62%,
      rgba(2, 33, 28, 0.25) 100%
    ),
    linear-gradient(
      0deg,
      rgba(2, 29, 25, 0.72),
      transparent 40%
    );
}

.hero-accent {
  z-index: -1;
  background: radial-gradient(
    ellipse at 35% 75%,
    rgba(12, 160, 97, 0.14),
    transparent 60%
  );
}

.hero-container {
  width: min(100% - 100px, 1450px);
  margin: 0 auto;
}

.hero-content {
  width: 100%;
  max-width: 850px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.23);
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.09);
  color: #e0f8e8;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 1.4px;
  backdrop-filter: blur(8px);
}

.eyebrow-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #8af1ad;
  box-shadow: 0 0 0 4px rgba(138, 241, 173, 0.14);
}

.hero-overline {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 38px 0 18px;
  color: #a7edbf;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.overline-divider {
  width: 25px;
  height: 1px;
  background: rgba(167, 237, 191, 0.6);
}

.hero h1 {
  margin: 0;
  font-size: clamp(46px, 5.3vw, 86px);
  font-weight: 780;
  line-height: 1.08;
  letter-spacing: -3.6px;
  text-wrap: balance;
}

.hero h1 span {
  display: block;
  color: #a7efbf;
}

.hero-description {
  max-width: 650px;
  margin: 29px 0 0;
  color: #d2e6dc;
  font-size: clamp(15px, 1.1vw, 17px);
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 38px;
}

.hero-primary,
.hero-secondary {
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  padding: 16px 25px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 750;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.hero-primary {
  background: #0a9965;
  color: white;
  border: 1px solid #0a9965;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
}

.hero-primary:hover {
  background: #0db278;
  transform: translateY(-2px);
}

.hero-secondary {
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.hero-secondary:hover {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-2px);
}

.hero-security {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 19px;
  margin-top: 47px;
}

.hero-security > div {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #c1dcd0;
  font-size: 12px;
}

.security-separator {
  width: 1px;
  height: 17px;
  background: rgba(255, 255, 255, 0.3);
}

.hero-side-text {
  position: absolute;
  right: 34px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.56);
}

.scroll-prompt {
  position: absolute;
  bottom: 31px;
  left: max(50px, calc((100vw - 1450px) / 2));
  display: inline-flex;
  align-items: center;
  gap: 13px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1.8px;
}

.hero-bottom-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0a9965, #a7efbf, transparent);
}

/* ======================================
   SHARED SECTIONS
====================================== */

.section-container {
  width: min(100% - 80px, 1280px);
  margin: 0 auto;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: #087452;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.label-line {
  width: 25px;
  height: 2px;
  background: #0a9965;
}

.about-section,
.features-section,
.workflow-section {
  scroll-margin-top: 78px;
}

/* ======================================
   ABOUT
====================================== */

.about-section {
  padding: 115px 0;
  background: white;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 100px;
  align-items: start;
}

.about-heading h2,
.section-intro h2,
.access-copy h2 {
  margin: 23px 0 0;
  font-size: clamp(33px, 3.4vw, 49px);
  font-weight: 760;
  line-height: 1.17;
  letter-spacing: -1.7px;
}

.about-heading h2 span,
.section-intro h2 span {
  display: block;
  color: #087452;
}

.about-content p {
  margin: 0 0 22px;
  color: #64776e;
  font-size: 15px;
  line-height: 1.95;
}

.about-highlight {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-top: 35px;
  padding: 22px;
  border: 1px solid #dceee4;
  border-radius: 13px;
  background: #f5faf7;
}

.highlight-icon {
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #087452;
  background: #e1f3e8;
}

.about-highlight strong,
.about-highlight span {
  display: block;
}

.about-highlight strong {
  font-size: 14px;
}

.about-highlight span {
  margin-top: 7px;
  color: #6b7e74;
  font-size: 12px;
  line-height: 1.8;
}

/* ======================================
   FEATURES
====================================== */

.features-section {
  padding: 110px 0;
  background: #f5f8f6;
}

.section-intro {
  max-width: 760px;
  margin-bottom: 50px;
}

.section-intro p {
  max-width: 610px;
  margin-top: 20px;
  color: #697b72;
  font-size: 15px;
  line-height: 1.85;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 19px;
}

.feature-card {
  position: relative;
  min-height: 275px;
  padding: 31px;
  overflow: hidden;
  border: 1px solid #e3ebe6;
  border-radius: 15px;
  background: white;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: #c6e6d4;
  box-shadow: 0 20px 45px rgba(4, 49, 31, 0.07);
}

.feature-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.feature-icon {
  width: 51px;
  height: 51px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: #e6f5ec;
  color: #087452;
}

.feature-number {
  color: #b7c9bf;
  font-size: 13px;
  font-weight: 800;
}

.feature-card h3 {
  margin: 26px 0 12px;
  font-size: 17px;
  font-weight: 750;
  letter-spacing: -0.3px;
}

.feature-card p {
  margin: 0;
  color: #718278;
  font-size: 13px;
  line-height: 1.85;
}

.feature-bottom-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 3px;
  background: #0a9965;
  transition: width 0.25s ease;
}

.feature-card:hover .feature-bottom-line {
  width: 100%;
}

/* ======================================
   WORKFLOW
====================================== */

.workflow-section {
  padding: 115px 0;
  background: white;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
}

.workflow-step {
  padding-top: 23px;
  border-top: 1px solid #dce8e1;
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-number {
  color: #0a9965;
  font-size: 15px;
  font-weight: 800;
}

.step-arrow {
  color: #b5c8bd;
}

.workflow-step h3 {
  margin: 27px 0 11px;
  font-size: 17px;
  font-weight: 750;
}

.workflow-step p {
  margin: 0;
  color: #708078;
  font-size: 13px;
  line-height: 1.9;
}

/* ======================================
   ACCESS CTA
====================================== */

.access-section {
  padding: 90px 0;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(24, 166, 104, 0.19),
      transparent 45%
    ),
    #073a31;
  color: white;
}

.access-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 45px;
}

.access-copy {
  max-width: 700px;
}

.access-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #9de8b9;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.access-copy h2 {
  margin-top: 22px;
}

.access-copy h2 span {
  display: block;
  color: #9de8b9;
}

.access-copy p {
  max-width: 560px;
  margin-top: 20px;
  color: #bdd8cb;
  font-size: 14px;
  line-height: 1.9;
}

.access-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 235px;
}

.access-primary,
.access-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 51px;
  padding: 14px 21px;
  border-radius: 9px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 750;
}

.access-primary {
  color: white;
  background: #0a9965;
}

.access-primary:hover {
  background: #0db278;
}

.access-secondary {
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.access-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ======================================
   FOOTER
====================================== */

.site-footer {
  background: #042b25;
  color: white;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  padding-top: 35px;
  padding-bottom: 35px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.footer-brand img {
  width: 47px;
  height: 47px;
  object-fit: contain;
}

.footer-brand strong,
.footer-brand span,
.footer-info span {
  display: block;
}

.footer-brand strong {
  font-size: 14px;
}

.footer-brand span,
.footer-info span {
  margin-top: 5px;
  color: #a3c2b3;
  font-size: 11px;
}

.footer-info {
  text-align: right;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 20px;
  padding-bottom: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #8cae9e;
  font-size: 10px;
}

/* ======================================
   RESPONSIVE
====================================== */

@media (max-width: 1150px) {
  .main-nav {
    gap: 18px;
  }

  .brand-copy strong {
    font-size: 12px;
  }

  .brand-copy span {
    font-size: 10px;
  }

  .hero-side-text {
    display: none;
  }
}

@media (max-width: 960px) {
  .site-header,
  .site-header.scrolled,
  .site-header.menu-open {
    height: 76px;
  }

  .nav-container {
    width: min(100% - 40px, 1450px);
  }

  .mobile-menu {
    width: 43px;
    height: 43px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    cursor: pointer;
  }

  .main-nav {
    position: absolute;
    top: 100%;
    left: 20px;
    right: 20px;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 13px;
    background: rgba(3, 43, 35, 0.98);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(18px);
  }

  .main-nav.open {
    display: flex;
  }

  .main-nav > a {
    padding: 13px;
  }

  .mobile-nav-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
  }

  .mobile-nav-actions a {
    flex: 1;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    text-align: center;
    text-decoration: none;
    font-size: 13px;
  }

  .features-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .about-grid {
    gap: 50px;
  }

  .workflow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .section-container {
    width: min(100% - 40px, 1280px);
  }

  .nav-signin,
  .nav-register {
    display: none;
  }

  .brand-logo {
    width: 45px;
    height: 45px;
  }

  .hero {
    padding-top: 150px;
    padding-bottom: 110px;
  }

  .hero-container {
    width: min(100% - 44px, 1450px);
  }

  .hero-photo {
    background-position: 58% center;
  }

  .hero-shade {
    background: linear-gradient(
      90deg,
      rgba(2, 30, 26, 0.96),
      rgba(3, 41, 35, 0.79)
    );
  }

  .hero h1 {
    font-size: clamp(42px, 9vw, 63px);
    letter-spacing: -2px;
  }

  .hero-eyebrow {
    font-size: 9px;
    letter-spacing: 0.9px;
  }

  .hero-overline {
    font-size: 9px;
    letter-spacing: 1.3px;
    flex-wrap: wrap;
  }

  .hero-description {
    font-size: 14px;
  }

  .hero-security {
    gap: 13px;
  }

  .security-separator {
    display: none;
  }

  .scroll-prompt {
    left: 22px;
  }

  .about-section,
  .features-section,
  .workflow-section {
    padding: 75px 0;
  }

  .about-grid {
    grid-template-columns: 1fr;
    gap: 25px;
  }

  .features-grid,
  .workflow-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    min-height: auto;
  }

  .access-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .access-actions {
    width: 100%;
  }

  .footer-inner,
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-info {
    text-align: left;
  }
}

@media (max-width: 420px) {
  .brand-copy strong {
    font-size: 11px;
  }

  .brand-copy span {
    font-size: 9px;
  }

  .hero h1 {
    font-size: 39px;
  }

  .hero-primary,
  .hero-secondary {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .brand-logo,
  .feature-card,
  .feature-bottom-line,
  .hero-primary,
  .hero-secondary {
    transition: none;
  }
}
</style>
