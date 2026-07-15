import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Tenant, ModuleId } from '../types/auth';
import { ROLE_MODULE_ACCESS, MODULE_ID_MAP } from '../types/auth';
import { loginApi, getMyModulesApi, getUserProfile, updateAvatarApi } from '../api/auth';

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return {};

    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(paddedBase64));
  } catch {
    return {};
  }
}

function hasExpiredClaim(token: string | null): boolean {
  if (!token) return false;
  const value = decodeJwtPayload(token)['isExpired'];
  return value === true || (typeof value === 'string' && value.toLowerCase() === 'true');
}

interface LoginResult {
  success: boolean;
  error?: string;
  role?: string;
  isExpired?: boolean;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isExpired: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshModules: () => Promise<void>;
  updateUserAvatar: (url: string) => void;
  uploadAvatar: (file: File) => Promise<string>;
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
  const [isExpired, setIsExpired] = useState<boolean>(() =>
    hasExpiredClaim(localStorage.getItem('dodo_token'))
  );

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
      // Response là nguồn chính; claim giúp giữ đúng trạng thái khi reload và fail-safe khi contract lệch nhau.
      const sessionExpired =
        role !== 'SystemAdmin' && (authData.isExpired || hasExpiredClaim(authData.token));

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
        avatarUrl: null,
      };

      // 5. Gọi API lấy danh sách module (SystemAdmin không có tenant modules)
      let purchasedModules: ModuleId[] = [];
      let trialModules: ModuleId[] = [];

      if (role !== 'SystemAdmin' && !sessionExpired) {
        const subscriptions = await getMyModulesApi();
        purchasedModules = subscriptions
          .filter((s) => s.status !== 'Expired')
          .map((s) => MODULE_ID_MAP[s.moduleId])
          .filter((m): m is ModuleId => m !== undefined);
        trialModules = subscriptions
          .filter((s) => s.status === 'Trial')
          .map((s) => MODULE_ID_MAP[s.moduleId])
          .filter((m): m is ModuleId => m !== undefined);
      }

      // 6. Tạo Tenant object
      const tenantData: Tenant = {
        id: tenantId as unknown as number,
        name: authData.tenantName || 'DODO System',
        purchasedModules,
        trialModules,
      };

      // 7. Lưu vào state + localStorage
      setUser(userData);
      setTenant(tenantData);
      setIsExpired(sessionExpired);
      localStorage.setItem('dodo_user', JSON.stringify(userData));
      localStorage.setItem('dodo_tenant', JSON.stringify(tenantData));

      // 8. Lấy avatarUrl từ server (best-effort, không block login)
      getUserProfile().then((profile) => {
        setUser((prev) => {
          if (!prev) return prev;
          const withAvatar = { ...prev, avatarUrl: profile.avatarUrl, phone: profile.phone };
          localStorage.setItem('dodo_user', JSON.stringify(withAvatar));
          return withAvatar;
        });
      }).catch(() => {});

      return { success: true, role, isExpired: sessionExpired };
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

  // On startup: if already logged in, refresh avatarUrl from server
  useEffect(() => {
    const token = localStorage.getItem('dodo_token');
    if (!token) return;
    getUserProfile()
      .then((profile) => {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, avatarUrl: profile.avatarUrl, phone: profile.phone };
          localStorage.setItem('dodo_user', JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => { /* silent — stale token will be caught by interceptor */ });
  }, []);

  const updateUserAvatar = useCallback((url: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatarUrl: url };
      localStorage.setItem('dodo_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    const profile = await updateAvatarApi(file);
    updateUserAvatar(profile.avatarUrl ?? '');
    return profile.avatarUrl ?? '';
  }, [updateUserAvatar]);

  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    setIsExpired(false);
    localStorage.removeItem('dodo_user');
    localStorage.removeItem('dodo_tenant');
    localStorage.removeItem('dodo_token');
    localStorage.removeItem('dodo_refreshToken');
  }, []);

  const refreshModules = useCallback(async () => {
    if (user?.role === 'SystemAdmin') return; // SystemAdmin không có tenant modules
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
      setTenant((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, purchasedModules, trialModules };
        localStorage.setItem('dodo_tenant', JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silent fail — user can retry
    }
  }, [user?.role]);

  return (
    <AuthContext.Provider
      value={{ user, tenant, isAuthenticated: !!user, isExpired, login, logout, refreshModules, updateUserAvatar, uploadAvatar }}
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
