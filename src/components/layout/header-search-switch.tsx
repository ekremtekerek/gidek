'use client';

import { usePathname } from 'next/navigation';
import { CityChip } from '@/components/layout/context-chips';
import { HeaderSearch } from '@/components/layout/header-search';
import { TravelHeaderSearch } from '@/components/layout/travel-header-search';
import type { SupportedCity } from '@/lib/utils/constants';

interface Props {
  /** Mevcut kullanıcı şehri (fırsat modunda). */
  city: SupportedCity;
  /** Tatil dünyası için destinasyon listesi (mevcut DB envanteri). */
  travelLocations: string[];
}

/**
 * Header'da pathname'e göre arama widget'ını değiştirir:
 * - `/tatil*` → kompakt tatil arama (Destinasyon + Tarih + Kişi)
 * - diğer her şey → mevcut HeaderSearch + CityChip kombinasyonu
 *
 * Şehir chip'i tatil dünyasında mantıksız çünkü kullanıcı başka bir
 * şehre gidiyor — bu yüzden tatil rotasında gizleniyor.
 */
export function HeaderSearchSwitch({ city, travelLocations }: Props) {
  const pathname = usePathname();
  const isTravel = pathname?.startsWith('/tatil');

  if (isTravel) {
    return <TravelHeaderSearch locations={travelLocations} />;
  }

  return (
    <div className="flex w-full max-w-2xl items-center gap-2">
      <HeaderSearch />
      <CityChip value={city} />
    </div>
  );
}
