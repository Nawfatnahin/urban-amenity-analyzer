import { useQuery } from '@tanstack/react-query';
import type { GroupedAmenities } from '@/lib/types';

async function fetchAmenities(
  lat: number,
  lon: number,
  radius: number
): Promise<GroupedAmenities> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    radius: radius.toString(),
  });

  const res = await fetch(`/api/amenities?${params}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Amenity fetch failed: ${res.status}`);
  }

  return res.json();
}

export function useAmenities(
  lat: number | null,
  lon: number | null,
  radius: number = 1200,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['amenities', lat, lon, radius],
    queryFn: () => fetchAmenities(lat!, lon!, radius),
    enabled: enabled && lat !== null && lon !== null,
    staleTime: 10 * 60 * 1000, // 10 minutes — matches server cache
    retry: 1, // Single retry (Overpass has mirror fallback server-side)
    retryDelay: 3000, // Wait 3s before retry to respect rate limits
  });
}
