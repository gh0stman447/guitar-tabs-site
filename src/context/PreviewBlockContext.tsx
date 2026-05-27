'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PreviewBlockContextValue {
  isPreviewBlocking: boolean;
  flippingTabId: string | null;
  startPreviewBlock: (tabId: string) => void;
  endPreviewBlock: () => void;
}

const PreviewBlockContext = createContext<PreviewBlockContextValue | null>(null);

export function PreviewBlockProvider({ children }: { children: ReactNode }) {
  const [isPreviewBlocking, setIsPreviewBlocking] = useState(false);
  const [flippingTabId, setFlippingTabId] = useState<string | null>(null);

  const startPreviewBlock = useCallback((tabId: string) => {
    setIsPreviewBlocking(true);
    setFlippingTabId(tabId);
  }, []);

  const endPreviewBlock = useCallback(() => {
    setIsPreviewBlocking(false);
    setFlippingTabId(null);
  }, []);

  return (
    <PreviewBlockContext.Provider value={{ isPreviewBlocking, flippingTabId, startPreviewBlock, endPreviewBlock }}>
      {children}
      {isPreviewBlocking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            cursor: 'wait',
          }}
          aria-hidden="true"
        />
      )}
    </PreviewBlockContext.Provider>
  );
}

export function usePreviewBlock() {
  const ctx = useContext(PreviewBlockContext);
  if (!ctx) throw new Error('usePreviewBlock must be used within PreviewBlockProvider');
  return ctx;
}
