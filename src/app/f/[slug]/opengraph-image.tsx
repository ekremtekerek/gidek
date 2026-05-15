/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { getDealBySlug } from '@/lib/db/queries/deals';
import { SITE } from '@/lib/utils/site-config';

export const runtime = 'nodejs';
export const alt = 'gidek fırsat — paylaşım önizleme';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

/**
 * Her deal için dinamik Open Graph görseli.
 * Sosyal paylaşımlarda (Twitter, Facebook, WhatsApp) zengin önizleme verir.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
            fontFamily: 'system-ui',
          }}
        >
          <div
            style={{
              fontSize: 90,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.04em',
            }}
          >
            {SITE.name}
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const price = Number(deal.discounted_price);
  const original = Number(deal.original_price);
  const discount =
    price < original ? Math.round((1 - price / original) * 100) : 0;
  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'system-ui',
          background: '#0a0a0a',
        }}
      >
        {/* Arka plan görseli */}
        <img
          src={deal.cover_image}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
            display: 'flex',
          }}
        />

        {/* Sol üst — logo */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 50,
            color: 'white',
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            display: 'flex',
          }}
        >
          {SITE.name}
          <span style={{ opacity: 0.6 }}>.</span>
        </div>

        {/* Sağ üst — indirim rozeti */}
        {discount > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 50,
              padding: '12px 24px',
              borderRadius: 999,
              background:
                'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              color: 'white',
              fontSize: 36,
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(244,63,94,0.4)',
              display: 'flex',
            }}
          >
            %{discount} indirim
          </div>
        ) : null}

        {/* Alt — başlık + fiyat */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 50,
            right: 50,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {location ? (
            <div
              style={{
                fontSize: 26,
                opacity: 0.85,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              📍 {location}
            </div>
          ) : null}

          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              display: 'flex',
            }}
          >
            {deal.title.length > 80 ? deal.title.slice(0, 77) + '…' : deal.title}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              marginTop: 8,
            }}
          >
            {price < original ? (
              <span
                style={{
                  fontSize: 28,
                  opacity: 0.6,
                  textDecoration: 'line-through',
                  display: 'flex',
                }}
              >
                {original.toLocaleString('tr-TR')} ₺
              </span>
            ) : null}
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                background:
                  'linear-gradient(90deg, #fde68a 0%, #fbbf24 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'flex',
              }}
            >
              {price.toLocaleString('tr-TR')} ₺
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
