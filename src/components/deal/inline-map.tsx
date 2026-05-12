'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface Props {
  lat: number;
  lng: number;
  title: string;
}

/** Detay modal'ı için tek-marker'lı küçük Mapbox harita. */
export function InlineMap({ lat, lng, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [lng, lat],
      zoom: 15,
      pitch: 50,
      bearing: -17.6,
      antialias: true,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'lightPreset', 'day');
        if (typeof map.setLanguage === 'function') map.setLanguage('tr');
      } catch {
        // ignore
      }
    });

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'gidek-marker is-selected';
    el.textContent = '📍';
    el.setAttribute('aria-label', title);

    new mapboxgl.Marker(el, { anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);

    return () => {
      map.remove();
    };
  }, [lat, lng, title]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="bg-muted text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
        Harita için Mapbox token gerekiyor.
      </div>
    );
  }

  return <div ref={containerRef} className="size-full" />;
}
