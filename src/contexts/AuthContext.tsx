import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, Tenant, ModuleId } from '../types/auth';
import { ROLE_MODULE_ACCESS, MODULE_ID_MAP } from '../types/auth';
import { loginApi, getMyModulesApi } from '../api/auth';

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshModules: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dodo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem('dodo_tenant');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const authData = await loginApi({ email, password });

      // 2. Lưu token vào localStorage (interceptor tự đính kèm cho request sau)
      localStorage.setItem('dodo_token', authData.token);
      localStorage.setItem('dodo_refreshToken', authData.refreshToken);

      // 3. Decode JWT để lấy role, tenantId, userId
      const payload = decodeJwtPayload(authData.token);
      const role =
        (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) ??
        'Employee';
      const tenantId =
        (payload['tenantId'] as string) ?? '';
      const userId =
        (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) ?? '';

      // 4. Tạo User object
      const userData: User = {
        id: userId as unknown as number, // backend dùng GUID string
        name: authData.fullName,
        email: email,
        role: role as User['role'],
        tenantId: tenantId as unknown as number,
        avatarColor: '#1d6ced',
        phone: authData.phone,
        isActive: authData.isActive,
      };

      // 5. Gọi API lấy danh sách module đã đăng ký (token đã có trong localStorage)
      const subscriptions = await getMyModulesApi();
      const purchasedModules: ModuleId[] = subscriptions
        .filter((s) => s.status !== 'Expired')
        .map((s) => MODULE_ID_MAP[s.moduleId])
        .filter((m): m is ModuleId => m !== undefined);

      const trialModules: ModuleId[] = subscriptions
        .filter((s) => s.status === 'Trial')
        .map((s) => MODULE_ID_MAP[s.moduleId])
        .filter((m): m is ModuleId => m !== undefined);

      // 6. Tạo Tenant object
      const tenantData: Tenant = {
        id: tenantId as unknown as number,
        name: authData.tenantName,
        purchasedModules,
        trialModules,
      };

      // 7. Lưu vào state + localStorage
      setUser(userData);
      setTenant(tenantData);
      localStorage.setItem('dodo_user', JSON.stringify(userData));
      localStorage.setItem('dodo_tenant', JSON.stringify(tenantData));

      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; title?: string } };
      };
      const apiMessage =
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.title ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      return { success: false, error: apiMessage };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    localStorage.removeItem('dodo_user');
    localStorage.removeItem('dodo_tenant');
    localStorage.removeItem('dodo_token');
    localStorage.removeItem('dodo_refreshToken');
  }, []);

  const refreshModules = useCallback(async () => {
    try {
      const subscriptions = await getMyModulesApi();
      const purchasedModules: ModuleId[] = subscriptions
        .filter((s) => s.status !== 'Expired')
        .map((s) => MODULE_ID_MAP[s.moduleId])
        .filter((m): m is ModuleId => m !== undefined);
      const trialModules: ModuleId[] = subscriptions
        .filter((s) => s.status === 'Trial')
        .map((s) => MODULE_ID_MAP[s.moduleId])
        .filter((m): m is ModuleId => m !== undefined);
      setTenant((prev) =>
        prev ? { ...prev, purchasedModules, trialModules } : prev
      );
      // Sync to localStorage
      setTenant((prev) => {
        if (prev) localStorage.setItem('dodo_tenant', JSON.stringify(prev));
        return prev;
      });
    } catch {
      // silent fail — user can retry
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, tenant, isAuthenticated: !!user, login, logout, refreshModules }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function getAccessibleModules(user: User, tenant: Tenant): ModuleId[] {
  const allowed: ModuleId[] = ROLE_MODULE_ACCESS[user.role] ?? [];
  return tenant.purchasedModules.filter((m: ModuleId) => allowed.includes(m));
}
