'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authStore';

function Hydrator() {
  const hydrate = useAuth(s => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 20_000 } } }));
  return (
    <QueryClientProvider client={qc}>
      <Hydrator />
      {children}
    </QueryClientProvider>
  );
}
