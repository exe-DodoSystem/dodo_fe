import axiosClient from './axiosClient';
import type { AdminDashboardData, ManagerDashboardData, EmployeeDashboardData } from '../types/dashboard';

export async function getAdminDashboard(month: number, year: number): Promise<AdminDashboardData> {
  const res = await axiosClient.get('/api/v1/dashboard/admin', { params: { month, year } });
  return res.data;
}

export async function getManagerDashboard(month: number, year: number): Promise<ManagerDashboardData> {
  const res = await axiosClient.get('/api/v1/dashboard/manager', { params: { month, year } });
  return res.data;
}

export async function getEmployeeDashboard(month: number, year: number): Promise<EmployeeDashboardData> {
  const res = await axiosClient.get('/api/v1/dashboard/employee', { params: { month, year } });
  return res.data;
}
