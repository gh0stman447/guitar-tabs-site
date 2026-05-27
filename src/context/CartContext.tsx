'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Tab } from '@/types';
import { DISCOUNT_TIER_1_MIN, DISCOUNT_TIER_1_RATE, DISCOUNT_TIER_2_MIN, DISCOUNT_TIER_2_RATE } from '@/lib/constants';

const STORAGE_KEY = 'guitar-tabs-cart';
const STORAGE_KEY_TEST = 'guitar-tabs-cart-test';

function bulkDiscountRate(count: number) {
  if (count >= DISCOUNT_TIER_2_MIN) return DISCOUNT_TIER_2_RATE;
  if (count >= DISCOUNT_TIER_1_MIN) return DISCOUNT_TIER_1_RATE;
  return 0;
}

interface CartContextValue {
  items: Tab[];
  addItem: (tab: Tab) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
  subtotal: number;
  discountRate: number;
  discount: number;
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
      queueMicrotask(() => {
        setItems(raw ? JSON.parse(raw) : []);
        setLoaded(true);
      });
    } catch {
      queueMicrotask(() => {
        setItems([]);
        setLoaded(true);
      });
    }
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

  const subtotal = items.reduce((sum, t) => sum + t.price, 0);
  const discountRate = bulkDiscountRate(items.length);
  const discount = Math.round(subtotal * discountRate);
  const total = subtotal - discount;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, hasItem, subtotal, discountRate, discount, total, count: items.length, testMode, setTestMode }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
