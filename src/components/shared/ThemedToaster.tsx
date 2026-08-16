'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position='bottom-center'
      richColors
      expand
      visibleToasts={3}
      duration={2500}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}
