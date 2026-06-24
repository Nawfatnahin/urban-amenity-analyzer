import { NextRequest, NextResponse } from 'next/server';
import { AMENITIES } from '@/lib/amenities';
import type { AmenityPoint, GroupedAmenities } from '@/lib/types';

// ─── Overpass endpoints (primary + mirror fallback) ───
const OVERPASS_PRIMARY = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';

// ─── In-memory LRU cache ───
const CACHE_MAX = 50;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { data: GroupedAmenities; ts: number }>();

function getCacheKey(lat: number, lon: number, radius: number): string {
  // Round to ~100m precision to catch nearby queries
  const rlat = Math.round(lat * 100) / 100;
  const rlon = Math.round(lon * 100) / 100;
  return `${rlat}:${rlon}:${radius}`;
}

function getCached(key: string): GroupedAmenities | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function setCache(key: string, data: GroupedAmenities) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

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
      // Parse filter like '["amenity"~"school|kindergarten|college"]'
      const match = filter.match(/\["([^"]+)"(?:~"([^"]+)"|="([^"]+)")\]/);
      if (!match) continue;

      const key = match[1];
      const regexPattern = match[2]; // for ~ operator
      const exactValue = match[3]; // for = operator

      if (!(key in tags)) continue;

      if (exactValue) {
        if (tags[key] === exactValue) return category.id;
      } else if (regexPattern) {
        const regex = new RegExp(`^(?:${regexPattern})$`);
        if (regex.test(tags[key])) return category.id;
      } else {
        // Key-only filter like '["healthcare"]'
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

  // Try primary (60s timeout — Overpass can be slow during peak)
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
    console.warn('Overpass primary failed:', err instanceof Error ? err.message : err);
  }

  // Fallback to mirror (90s timeout — give it extra time)
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
    console.error('Overpass mirror also failed:', err instanceof Error ? err.message : err);
    throw new Error('All Overpass endpoints failed. The service may be temporarily overloaded.');
  }
}

// ─── Route Handler ───
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = parseFloat(params.get('lat') || '');
  const lon = parseFloat(params.get('lon') || '');
  const radius = parseInt(params.get('radius') || '1200', 10);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: 'Valid "lat" and "lon" query parameters are required' },
      { status: 400 }
    );
  }

  if (radius < 200 || radius > 5000) {
    return NextResponse.json(
      { error: 'Radius must be between 200 and 5000 meters' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = getCacheKey(lat, lon, radius);
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, max-age=600',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
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

    // Initialize grouped result
    const grouped: GroupedAmenities = {};
    for (const cat of AMENITIES) {
      grouped[cat.id] = [];
    }

    // Parse elements
    for (const el of data.elements) {
      if (!el.tags) continue;

      // Get coordinates: nodes have lat/lon, ways/relations have center
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

      // Determine category
      const categoryId = categorizeElement(el.tags);
      if (!categoryId || !grouped[categoryId]) continue;

      const point: AmenityPoint = {
        id: el.id,
        lat: elLat,
        lon: elLon,
        name: el.tags.name || el.tags['name:en'] || categoryId,
        category: categoryId,
      };

      // Avoid duplicates (same ID)
      if (!grouped[categoryId].some((p) => p.id === el.id)) {
        grouped[categoryId].push(point);
      }
    }

    // Cache result
    setCache(cacheKey, grouped);

    return NextResponse.json(grouped, {
      headers: {
        'Cache-Control': 'public, max-age=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Overpass fetch error:', error);

    // Rate limit detection
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        {
          error:
            'Overpass API is rate-limited. Please wait a moment and try again.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch amenity data. Please try again.' },
      { status: 502 }
    );
  }
}
