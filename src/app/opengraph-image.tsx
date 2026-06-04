import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/utils/site-config';

export const runtime = 'nodejs';
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

/**
 * Varsayılan Open Graph görseli — kendi opengraph-image'ı olmayan tüm
 * sayfalar (anasayfa, kategori, vb.) için. Deal sayfalarının kendi dinamik
 * görseli vardır (f/[slug]/opengraph-image.tsx).
 */
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
        fontFamily: 'system-ui',
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', fontSize: 104, fontWeight: 800, letterSpacing: '-0.04em' }}>
        {SITE.name}
        <span style={{ opacity: 0.6 }}>.net</span>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 52,
          fontWeight: 700,
          marginTop: 10,
          letterSpacing: '-0.02em',
        }}
      >
        {SITE.tagline}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 30,
          opacity: 0.92,
          marginTop: 28,
          maxWidth: 920,
          lineHeight: 1.35,
        }}
      >
        {SITE.description}
      </div>
    </div>,
    { ...size },
  );
}
