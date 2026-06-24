import { useQuery } from '@tanstack/react-query';
import { AMENITIES } from '@/lib/amenities';
import type { AmenityPoint, GroupedAmenities } from '@/lib/types';

// ─── Overpass endpoints (primary + mirror fallback) ───
const OVERPASS_PRIMARY = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';

// ─── Build single combined Overpass QL query ───
function buildOverpassQuery(lat: number, lon: number, radius: number): string {
  const filterLines: string[] = [];

  for (const category of AMENITIES) {
    for (const filter of category.overpassFilters) {
      filterLines.push(`  nwr${filter}(around:${radius},${lat},${lon});`);
    }
  }

  return `[out:json][timeout:25];
(
${filterLines.join('\n')}
);
out center tags;`;
}

// ─── Tag matching: determine which category an OSM element belongs to ───
function categorizeElement(tags: Record<string, string>): string | null {
  for (const category of AMENITIES) {
    for (const filter of category.overpassFilters) {
      const match = filter.match(/\["([^"]+)"(?:~"([^"]+)"|="([^"]+)")\]/);
      if (!match) continue;

      const key = match[1];
      const regexPattern = match[2];
      const exactValue = match[3];

      if (!(key in tags)) continue;

      if (exactValue) {
        if (tags[key] === exactValue) return category.id;
      } else if (regexPattern) {
        const regex = new RegExp(`^(?:${regexPattern})$`);
        if (regex.test(tags[key])) return category.id;
      } else {
        return category.id;
      }
    }
  }
  return null;
}

// ─── Fetch from Overpass with fallback ───
async function fetchOverpass(query: string): Promise<unknown> {
  const body = `data=${encodeURIComponent(query)}`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'UrbanAccessAnalyzer/1.0',
  };

  try {
    const res = await fetch(OVERPASS_PRIMARY, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(60000),
    });

    if (res.ok) {
      return await res.json();
    }
    console.warn(`Overpass primary returned ${res.status}, trying mirror...`);
  } catch (err) {
    console.warn('Overpass primary failed:', err instanceof Error ? err.message : String(err));
  }

  try {
    const res = await fetch(OVERPASS_MIRROR, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(90000),
    });

    if (res.ok) {
      return await res.json();
    }
    throw new Error(`Overpass mirror returned ${res.status}`);
  } catch (err) {
    console.error('Overpass mirror also failed:', err instanceof Error ? err.message : String(err));
    throw new Error('All Overpass endpoints failed. The service may be temporarily overloaded.');
  }
}

async function fetchAmenities(lat: number, lon: number, radius: number): Promise<GroupedAmenities> {
  const query = buildOverpassQuery(lat, lon, radius);
  const data = (await fetchOverpass(query)) as {
    elements: Array<{
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const grouped: GroupedAmenities = {};
  for (const cat of AMENITIES) {
    grouped[cat.id] = [];
  }

  for (const el of data.elements) {
    if (!el.tags) continue;

    let elLat: number | undefined;
    let elLon: number | undefined;

    if (el.type === 'node') {
      elLat = el.lat;
      elLon = el.lon;
    } else if (el.center) {
      elLat = el.center.lat;
      elLon = el.center.lon;
    }

    if (elLat === undefined || elLon === undefined) continue;

    const categoryId = categorizeElement(el.tags);
    if (!categoryId || !grouped[categoryId]) continue;

    const point: AmenityPoint = {
      id: el.id,
      lat: elLat,
      lon: elLon,
      name: el.tags.name || el.tags['name:en'] || categoryId,
      category: categoryId,
    };

    if (!grouped[categoryId].some((p) => p.id === el.id)) {
      grouped[categoryId].push(point);
    }
  }

  return grouped;
}

export function useAmenities(lat: number | null | undefined, lon: number | null | undefined, radius: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['amenities', lat, lon, radius],
    queryFn: () => fetchAmenities(lat!, lon!, radius),
    enabled: enabled && lat !== undefined && lon !== undefined && lat !== null && lon !== null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
