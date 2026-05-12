'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DealShape } from '@/lib/ai/tools';
import type { LatLng } from '@/lib/utils/geo';

/**
 * Anasayfa hero'da chat, harita ve welcome carousel'ı eşleyen ortak state.
 * - aiSuggestedDeals: chat'in tool sonuçları, harita pinler.
 * - userLocation: harita'da geolocation alındığında, welcome carousel'ı
 *   yakından uzağa sıralamak için paylaşılır.
 *
 * Sadece anasayfa hero'sunda mount edilir — diğer sayfalarda erişim yok.
 */
interface HomeStageValue {
  aiSuggestedDeals: DealShape[] | null;
  setAiSuggestedDeals: (deals: DealShape[] | null) => void;
  userLocation: LatLng | null;
  setUserLocation: (loc: LatLng | null) => void;
}

const HomeStageContext = createContext<HomeStageValue | null>(null);

export function HomeStageProvider({ children }: { children: ReactNode }) {
  const [aiSuggestedDeals, setAiSuggestedDealsState] = useState<DealShape[] | null>(null);
  const [userLocation, setUserLocationState] = useState<LatLng | null>(null);

  const setAiSuggestedDeals = useCallback((deals: DealShape[] | null) => {
    setAiSuggestedDealsState((prev) => {
      if (prev === deals) return prev;
      if (prev === null && deals === null) return prev;
      if (prev === null || deals === null) return deals;
      if (prev.length !== deals.length) return deals;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== deals[i].id) return deals;
      }
      return prev;
    });
  }, []);

  const setUserLocation = useCallback((loc: LatLng | null) => {
    setUserLocationState((prev) => {
      if (prev === loc) return prev;
      if (prev === null && loc === null) return prev;
      if (prev && loc && prev.lat === loc.lat && prev.lng === loc.lng) return prev;
      return loc;
    });
  }, []);

  const value = useMemo<HomeStageValue>(
    () => ({ aiSuggestedDeals, setAiSuggestedDeals, userLocation, setUserLocation }),
    [aiSuggestedDeals, setAiSuggestedDeals, userLocation, setUserLocation],
  );

  return <HomeStageContext.Provider value={value}>{children}</HomeStageContext.Provider>;
}

export function useHomeStage(): HomeStageValue | null {
  return useContext(HomeStageContext);
}
