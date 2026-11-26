<script setup lang="ts">
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-vue-next";

import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center
           bg-slate-50 px-6"
  >
    <div class="w-full max-w-md text-center">

      <div
        class="mx-auto mb-8 flex h-20 w-20
               items-center justify-center rounded-2xl
               border border-emerald-100 bg-emerald-50"
      >
        <ShieldAlert
          :size="36"
          class="text-emerald-800"
          :stroke-width="1.5"
        />
      </div>

      <p
        class="mb-3 text-xs font-semibold uppercase
               tracking-[0.25em] text-emerald-700"
      >
        Error 403
      </p>

      <h1
        class="text-3xl font-bold tracking-tight
               text-slate-900"
      >
        Access restricted
      </h1>

      <p
        class="mt-4 text-sm leading-relaxed
               text-slate-500"
      >
        Your account does not have the required
        authorization to access this resource.
        Please contact your system administrator
        if you believe this is an error.
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">

        <button
          type="button"
          class="inline-flex items-center gap-2
                 rounded-lg border border-slate-200
                 bg-white px-5 py-3 text-sm font-medium
                 text-slate-700 transition hover:bg-slate-100"
          @click="router.back()"
        >
          <ArrowLeft :size="16" />
          Go back
        </button>

        <RouterLink
          to="/dashboard"
          class="inline-flex items-center gap-2
                 rounded-lg bg-emerald-900 px-5 py-3
                 text-sm font-medium text-white
                 transition hover:bg-emerald-800"
        >
          <LayoutDashboard :size="16" />
          Dashboard
        </RouterLink>

      </div>

      <p class="mt-12 text-xs text-slate-400">
        PGNO Payroll Management System
      </p>

    </div>
  </main>
</template>