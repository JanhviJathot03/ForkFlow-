'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Runs once on the client after hydration.
 * Loads the persisted auth state from localStorage into Zustand
 * without causing a server/client HTML mismatch.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
