import axiosClient from './axiosClient';
import type { RoleDto, RoleListResponse } from '../types/role';

export async function getAllRoles(): Promise<RoleDto[]> {
  const res = await axiosClient.get<RoleDto[]>('/api/Role/all');
  return res.data;
}

export async function getRoleById(id: number): Promise<RoleDto> {
  const res = await axiosClient.get<RoleDto>(`/api/Role/${id}`);
  return res.data;
}

export async function getRolesPaged(pageNumber = 1, pageSize = 10): Promise<RoleListResponse> {
  const res = await axiosClient.get<RoleListResponse>('/api/Role/all/page', {
    params: { pageNumber, pageSize },
  });
  return res.data;
}
