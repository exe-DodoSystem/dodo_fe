import axiosClient from './axiosClient';
import type { SystemTenantDto, TenantListResponse } from '../types/systemTenant';

export async function getTenants(
  pageNumber = 1,
  pageSize = 10,
): Promise<TenantListResponse> {
  const res = await axiosClient.get<TenantListResponse>('/api/system/tenants', {
    params: { pageNumber, pageSize },
  });
  return res.data;
}

export async function getTenantById(tenantId: string): Promise<SystemTenantDto> {
  const res = await axiosClient.get<SystemTenantDto>(`/api/system/tenants/${tenantId}`);
  return res.data;
}
