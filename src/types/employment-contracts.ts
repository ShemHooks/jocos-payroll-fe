export interface ContractEmployee {
  id: number;
  employee_no: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  name_extension: string | null;
}

export interface ContractOrganizationalUnit {
  id: number;
  code: string;
  name: string;
  type: "provincial_office" | "hospital";
  is_active: boolean;
}

export interface ContractDepartment {
  id: number;
  office_code: string;
  name: string;
  organizational_unit_id: number | null;
  organizational_unit: ContractOrganizationalUnit | null;
  is_active?: boolean;
}

export interface ContractPosition {
  id: number;
  position_code: string;
  title: string;
  salary_grade: number | null;
  standard_monthly_rate: string | number | null;
  is_active?: boolean;
}

export type EffectiveContractStatus =
  | "active"
  | "upcoming"
  | "expired"
  | "cancelled";

export interface EmploymentContractPayload {
  employee_id: number;
  department_id: number;
  position_id: number;
  employment_type: string;
  salary_rate: string;
  salary_period: string;
  start_date: string;
  end_date: string | null;
}

export interface EmploymentContract
  extends EmploymentContractPayload {
  id: number;
  status: string;
  effective_status: EffectiveContractStatus;
  created_at: string;
  employee: ContractEmployee;
  department: ContractDepartment;
  position: ContractPosition;
}

export interface EmploymentContractListResponse {
  items: EmploymentContract[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ContractFilters {
  page?: number;
  page_size?: number;
  search?: string;
  employee_id?: number;
  department_id?: number;
  organizational_unit_id?: number;
  employment_type?: string;
  contract_status?: string;
}