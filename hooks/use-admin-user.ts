'use client';

import * as React from 'react';

export interface AdminUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

const STORAGE_KEY = 'adminUser';

interface AdminUserContextValue {
  user: AdminUser | null;
  hasLoadedFromStorage: boolean;
  setUser: (user: AdminUser | null) => void;
}

const AdminUserContext = React.createContext<AdminUserContextValue | undefined>(
  undefined
);

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<AdminUser | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminUser;
        setUserState(parsed);
      }
    } catch {
      // Ignore storage or parse errors
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  const setUser = React.useCallback((next: AdminUser | null) => {
    setUserState(next);
    try {
      if (typeof window !== 'undefined') {
        if (next) {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } else {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, hasLoadedFromStorage, setUser }),
    [user, hasLoadedFromStorage, setUser],
  );

  return React.createElement(
    AdminUserContext.Provider,
    { value },
    children,
  );
}

export function useAdminUser() {
  const ctx = React.useContext(AdminUserContext);
  if (!ctx) {
    throw new Error('useAdminUser must be used within an AdminUserProvider');
  }
  return ctx.user;
}

export function useAdminUserSetter() {
  const ctx = React.useContext(AdminUserContext);
  if (!ctx) {
    throw new Error('useAdminUserSetter must be used within an AdminUserProvider');
  }
  return ctx.setUser;
}

export function useAdminUserLoaded() {
  const ctx = React.useContext(AdminUserContext);
  if (!ctx) {
    throw new Error('useAdminUserLoaded must be used within an AdminUserProvider');
  }
  return ctx.hasLoadedFromStorage;
}

