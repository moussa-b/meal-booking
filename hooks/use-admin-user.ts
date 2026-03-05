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

export function useAdminUser() {
  const [user, setUser] = React.useState<AdminUser | null>(null);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as AdminUser;
      setUser(parsed);
    } catch {
      // Ignore storage or parse errors
    }
  }, []);

  return user;
}

