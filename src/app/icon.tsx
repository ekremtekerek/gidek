import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

/**
 * Dinamik PWA ikonu — 192x192. Siyah arkaplan, beyaz "g" harfi.
 * /icon URL'inde servis edilir.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#ffffff',
          fontSize: 140,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        g
      </div>
    ),
    { ...size },
  );
}
