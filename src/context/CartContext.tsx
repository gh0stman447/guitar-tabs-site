'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Tab } from '@/types';

const STORAGE_KEY = 'guitar-tabs-cart';
const STORAGE_KEY_TEST = 'guitar-tabs-cart-test';

interface CartContextValue {
  items: Tab[];
  addItem: (tab: Tab) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
  total: number;
  count: number;
  testMode: boolean;
  setTestMode: (v: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Tab[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [testMode, setTestModeState] = useState(false);

  const storageKey = testMode ? STORAGE_KEY_TEST : STORAGE_KEY;

  // Load from storage when testMode changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, [storageKey]);

  // Save to storage on items change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, loaded, storageKey]);

  const setTestMode = useCallback((v: boolean) => {
    setLoaded(false);
    setTestModeState(v);
  }, []);

  const addItem = useCallback((tab: Tab) => {
    setItems((prev) => (prev.some((t) => t.id === tab.id) ? prev : [...prev, tab]));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const hasItem = useCallback((id: string) => items.some((t) => t.id === id), [items]);

  const total = items.reduce((sum, t) => sum + t.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, hasItem, total, count: items.length, testMode, setTestMode }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
