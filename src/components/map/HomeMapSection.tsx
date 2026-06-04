import { getDealsInBounds } from '@/lib/db/queries/deals';
import { CITY_CENTROIDS, ISTANBUL_CENTER, type LatLng } from '@/lib/utils/geo';
import { getUserContext } from '@/lib/security/user-context-server';
import { MapExperience } from './MapExperience';

/**
 * Server wrapper — kullanıcının seçtiği şehrin bbox'undaki fırsatları SSR'de
 * çeker, MapExperience client komponentine başlangıç merkezi + deals olarak
 * pas eder.
 */
const DEFAULT_HALF_DEGREE = 0.25;

export async function HomeMapSection() {
  const ctx = await getUserContext();
  const center: LatLng = CITY_CENTROIDS[ctx.city] ?? ISTANBUL_CENTER;

  const initialDeals = await getDealsInBounds({
    sw: {
      lat: center.lat - DEFAULT_HALF_DEGREE,
      lng: center.lng - DEFAULT_HALF_DEGREE,
    },
    ne: {
      lat: center.lat + DEFAULT_HALF_DEGREE,
      lng: center.lng + DEFAULT_HALF_DEGREE,
    },
  });

  // key={ctx.city}: şehir değişince setCityAction revalidate eder, bu server
  // component yeni merkez+deal'larla yeniden render olur ve key değiştiği için
  // MapExperience remount olur → harita anında yeni şehre geçer (reload gerekmez).
  return <MapExperience key={ctx.city} initialDeals={initialDeals} initialCenter={center} />;
}
