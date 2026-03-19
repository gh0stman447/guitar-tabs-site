'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AdminContextValue {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const AdminContext = createContext<AdminContextValue>({ isAdmin: false, setIsAdmin: () => {} });

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me').then((res) => {
      if (res.ok) setIsAdmin(true);
    });
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
