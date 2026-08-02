'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Tab } from '@/types';
import { DISCOUNT_TIER_1_MIN, DISCOUNT_TIER_1_RATE, DISCOUNT_TIER_2_MIN, DISCOUNT_TIER_2_RATE, TABLE_TABS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

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
  const itemsRef = useRef(items);

  const storageKey = testMode ? STORAGE_KEY_TEST : STORAGE_KEY;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const reconcileWithCatalog = useCallback(async (candidateItems?: Tab[]) => {
    const candidate = candidateItems ?? itemsRef.current;
    if (candidate.length === 0) return;

    const { data, error } = await supabase
      .from(TABLE_TABS)
      .select('*')
      .eq('is_published', true);

    if (error || !data) return;

    const paidTabs = new Map(
      (data as Tab[]).filter((tab) => tab.price > 0).map((tab) => [tab.id, tab]),
    );
    setItems((current) =>
      current.flatMap((savedTab) => {
        const currentTab = paidTabs.get(savedTab.id);
        return currentTab ? [currentTab] : [];
      }),
    );
  }, []);

  // Load the saved cart and immediately remove deleted, unpublished or free tabs.
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(storageKey);
      const savedItems = raw ? (JSON.parse(raw) as Tab[]) : [];
      queueMicrotask(() => {
        if (cancelled) return;
        setItems(savedItems);
        setLoaded(true);
        void reconcileWithCatalog(savedItems);
      });
    } catch {
      queueMicrotask(() => {
        if (cancelled) return;
        setItems([]);
        setLoaded(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [reconcileWithCatalog, storageKey]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        const nextItems = event.newValue ? (JSON.parse(event.newValue) as Tab[]) : [];
        setItems(nextItems);
        void reconcileWithCatalog(nextItems);
      } catch {
        setItems([]);
      }
    };
    const handleFocus = () => void reconcileWithCatalog();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [reconcileWithCatalog, storageKey]);

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
