export const RoleCode = {
  ADMIN: "admin",
  ACCOUNTING: "accounting",
  TREASURER: "treasurer",
  PAYROLL_ENCODER: "payroll_encoder",
  HOSPITAL_ENCODER: "hospital_encoder",
} as const;

export type RoleCode =
  (typeof RoleCode)[keyof typeof RoleCode];

export const PermissionCode = {
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",

  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_VIEW: "permissions.view",

  ORGANIZATIONAL_UNITS_VIEW: "organizational_units.view",
  ORGANIZATIONAL_UNITS_MANAGE: "organizational_units.manage",

  ORGANIZATIONAL_ASSIGNMENTS_MANAGE:
    "organizational_assignments.manage",

  DEPARTMENT_MAPPINGS_VIEW:
    "department_mappings.view",

  DEPARTMENT_MAPPINGS_MANAGE:
    "department_mappings.manage",

  DEPARTMENTS_VIEW: "departments.view",
  POSITIONS_VIEW: "positions.view",

  HRIS_REFERENCES_VIEW: "hris.references.view",

  HRIS_EMPLOYEES_VIEW: "hris.employees.view",
  HRIS_APPOINTMENTS_VIEW: "hris.appointments.view",

  HRIS_SYNC_VIEW: "hris.sync.view",
  HRIS_SYNC_REVIEW: "hris.sync.review",
  HRIS_SYNC_APPROVE: "hris.sync.approve",
  HRIS_SYNC_EXECUTE: "hris.sync.execute",
  HRIS_SYNC_RETRY: "hris.sync.retry",

  EMPLOYEES_VIEW: "employees.view",

  EMPLOYEES_STATUS_MANAGE:
    "employees.status.manage",

  APPOINTMENT_APPROVALS_VIEW:
    "appointment_approvals.view",

  APPOINTMENT_APPROVALS_REVOKE:
    "appointment_approvals.revoke",

  PAYROLL_VIEW: "payroll.view",
  PAYROLL_CREATE: "payroll.create",
  PAYROLL_UPDATE: "payroll.update",
  PAYROLL_SUBMIT: "payroll.submit",
  PAYROLL_REVIEW: "payroll.review",

  TREASURY_EXPORT: "treasury.export",
} as const;

export type PermissionCode =
  (typeof PermissionCode)[keyof typeof PermissionCode];

export const RoleLabels: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: "Administrator",
  [RoleCode.ACCOUNTING]: "Accounting",
  [RoleCode.TREASURER]: "Treasurer",
  [RoleCode.PAYROLL_ENCODER]: "Payroll Encoder",
  [RoleCode.HOSPITAL_ENCODER]: "Hospital Encoder",
};