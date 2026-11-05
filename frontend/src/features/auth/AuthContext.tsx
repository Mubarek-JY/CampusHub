import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../../lib/api/endpoints';
import { refreshAccessToken, resetSessionExpiryNotification } from '../../lib/api/client';
import { clearSessionTokens, getRefreshToken, setAccessToken, setRefreshToken } from '../../lib/api/tokenStore';
import type { LoginInput, RegisterInput, User } from '../../lib/api/types';
import { useToast } from '../../hooks/useToast';

type AuthContextValue = {
  user: User | null; isLoading: boolean; isAuthenticated: boolean;
  signIn: (input: LoginInput) => Promise<void>; signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>; updateUser: (user: User) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clearAuth = useCallback(() => {
    clearSessionTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const token = getRefreshToken();
      if (!token) { if (active) setIsLoading(false); return; }
      try {
        await refreshAccessToken();
        const result = await getMe();
        if (active) setUser(result.user);
      } catch {
        const tokenRemains = Boolean(getRefreshToken());
        clearAuth();
        if (active && tokenRemains) toast('Could not restore your session. Please sign in again.', 'error');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, [clearAuth, toast]);

  useEffect(() => {
    const onExpired = () => {
      clearAuth();
      toast('Your session expired. Please sign in again.', 'error');
    };
    window.addEventListener('campushub:session-expired', onExpired);
    return () => window.removeEventListener('campushub:session-expired', onExpired);
  }, [clearAuth, toast]);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input);
    setRefreshToken(result.refreshToken);
    setAccessToken(result.accessToken);
    resetSessionExpiryNotification();
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const result = await registerRequest(input);
    setRefreshToken(result.refreshToken);
    setAccessToken(result.accessToken);
    resetSessionExpiryNotification();
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try { await logoutRequest(refreshToken); } catch { /* local logout must still complete */ }
    }
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(() => ({
    user, isLoading, isAuthenticated: Boolean(user), signIn, signUp, signOut, updateUser: setUser,
  }), [user, isLoading, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
