'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AdminContextValue {
  isAdmin: boolean;
  isLoading: boolean;
  setIsAdmin: (v: boolean) => void;
}

const AdminContext = createContext<AdminContextValue>({ isAdmin: false, isLoading: true, setIsAdmin: () => {} });

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => {
        if (res.ok) {
          setIsAdmin(true);
        }
      })
      .catch((err) => {
        console.error('[AdminContext] Error checking admin session:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, setIsAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
