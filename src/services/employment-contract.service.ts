import { api } from "../lib/api";

import type {
  EmploymentContract,
  EmploymentContractPayload,
  EmploymentContractListResponse,
  ContractFilters,
} from "../types/employment-contracts";

const ENDPOINT = "/employment-contracts";

export const employmentContractService = {
  async list(
    filters: ContractFilters = {}
  ): Promise<EmploymentContractListResponse> {
    const response = await api.get(
      ENDPOINT,
      {
        params: filters,
      }
    );

    return response.data;
  },

  async get(
    id: number
  ): Promise<EmploymentContract> {
    const response = await api.get(
      `${ENDPOINT}/${id}`
    );

    return response.data;
  },

  async create(
    payload: EmploymentContractPayload
  ): Promise<EmploymentContract> {
    const response = await api.post(
      ENDPOINT,
      payload
    );

    return response.data;
  },

  async update(
    id: number,
    payload: EmploymentContractPayload
  ): Promise<EmploymentContract> {
    const response = await api.put(
      `${ENDPOINT}/${id}`,
      payload
    );

    return response.data;
  },

  async updateStatus(
    id: number,
    status: "active" | "cancelled"
  ): Promise<EmploymentContract> {
    const response = await api.patch(
      `${ENDPOINT}/${id}/status`,
      { status }
    );

    return response.data;
  },

  async history(
    employeeId: number,
    page = 1
  ): Promise<EmploymentContractListResponse> {
    const response = await api.get(
      ENDPOINT,
      {
        params: {
          employee_id: employeeId,
          page,
          page_size: 20,
        },
      }
    );

    return response.data;
  },
};