import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory LRU cache ───
const CACHE_MAX = 100;
const cache = new Map<string, { data: unknown; ts: number }>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  // Expire after 24h
  if (Date.now() - entry.ts > 86400_000) {
    cache.delete(key);
    return null;
  }
  // Move to end (LRU)
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function setCache(key: string, data: unknown) {
  if (cache.size >= CACHE_MAX) {
    // Delete oldest (first entry)
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

// ─── Throttle: 1 request per second to Nominatim ───
let lastRequestTime = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed));
  }
  lastRequestTime = Date.now();
}

// ─── Route Handler ───
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required (min 2 characters)' },
      { status: 400 }
    );
  }

  const query = q.trim().toLowerCase();

  // Check cache
  const cached = getCached(query);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'HIT',
      },
    });
  }

  // Throttle
  await throttle();

  const userAgent =
    process.env.NOMINATIM_USER_AGENT ||
    'UrbanAccessAnalyzer/1.0 (portfolio-project)';

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', q.trim());
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '5');
      url.searchParams.set('accept-language', 'en'); // Force English results

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
          'Accept-Language': 'en', // Redundant but good practice
        },
      });

    if (!res.ok) {
      console.error(`Nominatim error: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: 'Geocoding service temporarily unavailable' },
        { status: 502 }
      );
    }

    const raw = await res.json();

    // Trim response to only what we need
    const results = raw.map(
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

    // Cache the result
    setCache(query, results);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Geocoding fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geocoding results' },
      { status: 500 }
    );
  }
}
