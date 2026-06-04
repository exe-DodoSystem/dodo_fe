import axiosClient from './axiosClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  fullName: string;
  phone: string;
  isActive: boolean;
  isDeleted: boolean;
  token: string;
  refreshToken: string;
  tenantName: string;
}

export interface ModuleSubscription {
  id: string;
  tenantId: string;
  moduleId: number;
  startDate: string;
  endDate: string;
  status: string;
}

// POST /api/Auth/login

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosClient.post<LoginResponse>('/api/Auth/login', data);
  return response.data;
}

// GET /api/ModuleSubscriptions/me/all

export async function getMyModulesApi(): Promise<ModuleSubscription[]> {
  const response = await axiosClient.get<ModuleSubscription[]>('/api/ModuleSubscriptions/me/all');
  return response.data;
}

// Register API 

export interface RegisterRequest {
  companyName: string;
  moduleIds: number[];
  adminFullName: string;
  adminEmail: string;
  password: string;
  phoneNumber: string;
}

// POST /api/Auth/register

export async function registerApi(data: RegisterRequest): Promise<void> {
  await axiosClient.post('/api/Auth/register', data);
}
