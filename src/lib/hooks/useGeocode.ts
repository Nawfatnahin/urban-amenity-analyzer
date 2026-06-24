import { useQuery } from '@tanstack/react-query';
import type { GeocodedPlace } from '@/lib/types';

// Throttle: 1 request per second to Nominatim
let lastRequestTime = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed));
  }
  lastRequestTime = Date.now();
}

async function fetchGeocode(query: string): Promise<GeocodedPlace[]> {
  if (!query || query.trim().length < 2) return [];

  await throttle();

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');
  url.searchParams.set('accept-language', 'en');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'UrbanAccessAnalyzer/1.0 (portfolio-project)',
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  const raw = await res.json();

  // Trim response to only what we need
  return raw.map(
    (item: {
      display_name: string;
      lat: string;
      lon: string;
      boundingbox: [string, string, string, string];
      type: string;
    }) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      boundingbox: item.boundingbox,
      type: item.type,
    })
  );
}

export function useGeocode(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['geocode', query],
    queryFn: () => fetchGeocode(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    placeholderData: (prev) => prev,
  });
}
