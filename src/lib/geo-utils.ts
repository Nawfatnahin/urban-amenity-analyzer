import type { GroupedAmenities } from './types';

/**
 * Create a GeoJSON circle polygon for the radius overlay.
 * Approximates a circle with 64 segments.
 */
export function createCircleGeoJSON(
  center: { lat: number; lon: number },
  radiusMeters: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const coords: [number, number][] = [];
  const earthRadius = 6_371_000;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);

    const lat = center.lat + (dy / earthRadius) * (180 / Math.PI);
    const lon =
      center.lon +
      ((dx / earthRadius) * (180 / Math.PI)) /
        Math.cos((center.lat * Math.PI) / 180);

    coords.push([lon, lat]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

/**
 * Convert grouped amenities to GeoJSON FeatureCollection for map layers.
 */
export function amenitiesToGeoJSON(
  grouped: GroupedAmenities
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

  for (const [categoryId, points] of Object.entries(grouped)) {
    for (const point of points) {
      features.push({
        type: 'Feature',
        properties: {
          id: point.id,
          name: point.name,
          category: categoryId,
        },
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
