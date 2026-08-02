'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  telegramConnected: boolean;
}

interface UserAuthValue {
  user: CurrentUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthValue | null>(null);

export function UserAuthProvider({
  children,
  hasSessionCookie,
}: {
  children: React.ReactNode;
  hasSessionCookie: boolean;
}) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(hasSessionCookie);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const payload = (await response.json()) as { user?: CurrentUser | null };
      setUser(response.ok ? (payload.user ?? null) : null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasSessionCookie) void refresh();
  }, [hasSessionCookie, refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, refresh, logout }), [user, isLoading, refresh, logout]);
  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}

export function useUserAuth() {
  const value = useContext(UserAuthContext);
  if (!value) throw new Error('useUserAuth must be used inside UserAuthProvider');
  return value;
}
