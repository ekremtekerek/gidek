'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Anasayfa "Tüm fırsatlar" infinite scroll için tek query client.
 * Provider'ı sadece ihtiyaç duyan ağacı sarmak için kullanıyoruz; root
 * layout'a koymadık, böylece sadece o sayfada bundle yüklenir.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
