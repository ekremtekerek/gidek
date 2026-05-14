/**
 * Harita derin link yardımcıları. Mobilde Google Maps app intercept eder;
 * iOS'te app yoksa Apple Maps'e otomatik düşer. Kendi turn-by-turn'ümüzü
 * yazmıyoruz — kullanıcının tercih ettiği app'i kullanmasını sağlıyoruz.
 *
 * Universal "?api=1" formatı: https://developers.google.com/maps/documentation/urls/get-started
 */
export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  const dest = `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}
