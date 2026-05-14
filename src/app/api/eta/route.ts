import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Mapbox Directions API proxy — kullanıcının konumundan fırsat noktasına
 * canlı trafiğe göre sürüş süresi tahmini döner.
 *
 * Query: ?fromLat=&fromLng=&toLat=&toLng=
 * Token Vercel env (NEXT_PUBLIC_MAPBOX_TOKEN). Public token; ama yine de
 * server-side proxy ile koordinatları validate ediyoruz.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromLat = Number(url.searchParams.get('fromLat'));
  const fromLng = Number(url.searchParams.get('fromLng'));
  const toLat = Number(url.searchParams.get('toLat'));
  const toLng = Number(url.searchParams.get('toLng'));

  function valid(lat: number, lng: number) {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  if (!valid(fromLat, fromLng) || !valid(toLat, toLng)) {
    return NextResponse.json({ error: 'invalid_coords' }, { status: 400 });
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 503 });
  }

  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'simplified',
    access_token: token,
  });
  const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?${params}`;

  try {
    const r = await fetch(mapboxUrl, { next: { revalidate: 0 } });
    if (!r.ok) {
      return NextResponse.json({ error: 'mapbox_error' }, { status: 502 });
    }
    const json = (await r.json()) as {
      routes?: Array<{ duration?: number; distance?: number }>;
    };
    const route = json.routes?.[0];
    if (!route) return NextResponse.json({ error: 'no_route' }, { status: 404 });

    return NextResponse.json({
      durationMinutes: Math.round((route.duration ?? 0) / 60),
      distanceKm: Math.round(((route.distance ?? 0) / 1000) * 10) / 10,
    });
  } catch (err) {
    console.error('[eta] fetch failed:', err);
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }
}
