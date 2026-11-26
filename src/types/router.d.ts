import "vue-router";

import type {
  RoleCode,
  PermissionCode,
} from "@/constants/authorization";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    allowPasswordChange?: boolean;

    roles?: readonly RoleCode[];
    permissions?: readonly PermissionCode[];
  }
}

export {};