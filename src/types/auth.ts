import type {
  RoleCode,
  PermissionCode,
} from "@/constants/authorization";

export interface Role {
  id: number;
  code: RoleCode;
  name: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  username: string;
  email: string | null;

  is_active: boolean;
  must_change_password: boolean;

  roles: Role[];
  permissions: PermissionCode[];

  password_changed_at: string | null;
  created_at: string | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  expires_at: string;
  must_change_password: boolean;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}