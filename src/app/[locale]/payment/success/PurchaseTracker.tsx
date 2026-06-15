'use client';

import { useEffect, useRef } from 'react';
import { reachGoal, purchase as trackPurchase } from '@/lib/yandex-metrika';

interface PurchaseTrackerProps {
  purchase: {
    id: string;
    amount: number;
    tab_ids?: string[] | null;
  };
  locale: string;
}

/**
 * Компонент для отслеживания успешной покупки в Яндекс Метрике.
 * Отправляет события reachGoal и ecommerce purchase.
 * Защищён от повторной отправки при ре-рендерах.
 */
export function PurchaseTracker({ purchase, locale }: PurchaseTrackerProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Защита от дублирования: отправляем событие только один раз
    if (hasTrackedRef.current) {
      console.log('[PurchaseTracker] Already tracked, skipping:', purchase.id);
      return;
    }

    hasTrackedRef.current = true;

    const tabIds = purchase.tab_ids ?? [];
    const itemsCount = tabIds.length || 1;
    const pricePerItem = Math.round(purchase.amount / itemsCount);

    // Отправка цели
    reachGoal('purchase', {
      purchase_id: purchase.id,
      amount: purchase.amount,
      tab_ids: tabIds.join(','),
    });

    // E-commerce покупка
    trackPurchase({
      id: purchase.id,
      value: purchase.amount,
      items: tabIds.map((tabId) => ({
        id: tabId,
        name: `Tab ${tabId.slice(0, 8)}...`,
        price: pricePerItem,
        quantity: 1,
      })),
    });
  }, [purchase.id, purchase.amount, purchase.tab_ids, locale]);

  return null;
}
