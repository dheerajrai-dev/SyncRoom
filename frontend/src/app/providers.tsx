import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { useAuthStore } from '../features/auth/authStore';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const initializeSession = useAuthStore((state) => state.initializeSession);

  useEffect(() => {
    // Attempt session restore on app mount
    initializeSession();
  }, [initializeSession]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
