import { useQuery } from '@tanstack/react-query';
import type { GeocodedPlace } from '@/lib/types';

async function fetchGeocode(query: string): Promise<GeocodedPlace[]> {
  if (!query || query.trim().length < 2) return [];

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);

  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  return res.json();
}

export function useGeocode(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['geocode', query],
    queryFn: () => fetchGeocode(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — matches server cache
    placeholderData: (prev) => prev,
  });
}
