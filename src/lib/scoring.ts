// Scoring engine for the Urban Amenity Accessibility Analyzer
// Based on the 15-minute city methodology

import { AMENITIES } from './amenities';
import type { AmenityPoint, GroupedAmenities, CategoryScore, ScoreResult, Rating } from './types';

/**
 * Haversine distance between two points in meters.
 * Uses Earth radius = 6,371,000 m. No external dependency.
 */
export function haversine(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Convert straight-line meters to estimated walk minutes.
 * Uses a 1.4 detour factor (streets are ~40% longer than straight line)
 * and average walking speed of 80 m/min.
 */
export function metersToWalkMinutes(meters: number): number {
  return (meters * 1.4) / 80;
}

/**
 * Score a single amenity category (0–100).
 *
 * - Finds nearest amenity, converts to walk time
 * - Scores with smooth linear decay against idealMinutes
 * - Density bonus: +10 if 3+ amenities found (capped at 100)
 * - Gap: score 0 and isGap=true if no amenities found
 */
export function scoreCategory(
  center: { lat: number; lon: number },
  points: AmenityPoint[],
  categoryId: string
): CategoryScore {
  const category = AMENITIES.find((c) => c.id === categoryId);
  if (!category) {
    throw new Error(`Unknown category: ${categoryId}`);
  }

  // No amenities → gap
  if (points.length === 0) {
    return {
      categoryId: category.id,
      label: category.label,
      icon: category.emoji,
      color: category.color,
      score: 0,
      nearestMeters: Infinity,
      nearestMinutes: Infinity,
      count: 0,
      isGap: true,
    };
  }

  // Find nearest amenity
  let nearestMeters = Infinity;
  for (const point of points) {
    const dist = haversine(center, point);
    if (dist < nearestMeters) {
      nearestMeters = dist;
    }
  }

  const nearestMinutes = metersToWalkMinutes(nearestMeters);
  const ideal = category.idealMinutes;

  // Score with linear decay
  let score: number;
  if (nearestMinutes <= ideal) {
    score = 100;
  } else if (nearestMinutes >= ideal * 2) {
    score = 0;
  } else {
    score = 100 * (1 - (nearestMinutes - ideal) / ideal);
  }

  // Density bonus: +10 if 3+ amenities, capped at 100
  if (points.length >= 3) {
    score = Math.min(100, score + 10);
  }

  return {
    categoryId: category.id,
    label: category.label,
    icon: category.emoji,
    color: category.color,
    score: Math.round(score),
    nearestMeters: Math.round(nearestMeters),
    nearestMinutes: Math.round(nearestMinutes * 10) / 10,
    count: points.length,
    isGap: false,
  };
}

/**
 * Compute the overall accessibility score (0–100).
 * Weighted average of per-category scores using config weights.
 *
 * Rating bands:
 *   >= 75 → Well-served (true 15-minute neighborhood)
 *   50–74 → Moderately served
 *   < 50  → Underserved
 */
export function computeOverallScore(
  center: { lat: number; lon: number },
  groupedAmenities: GroupedAmenities
): ScoreResult {
  const perCategory: CategoryScore[] = [];

  for (const category of AMENITIES) {
    const points = groupedAmenities[category.id] || [];
    const categoryScore = scoreCategory(center, points, category.id);
    perCategory.push(categoryScore);
  }

  // Weighted average
  let overall = 0;
  for (let i = 0; i < AMENITIES.length; i++) {
    overall += perCategory[i].score * AMENITIES[i].weight;
  }
  overall = Math.round(overall);

  // Rating band
  let rating: Rating;
  if (overall >= 75) {
    rating = 'Well-served';
  } else if (overall >= 50) {
    rating = 'Moderately served';
  } else {
    rating = 'Underserved';
  }

  return { overall, rating, perCategory };
}

/**
 * Generate a human-readable summary sentence.
 */
export function generateSummary(
  placeName: string,
  result: ScoreResult
): string {
  const { overall, rating, perCategory } = result;
  const gaps = perCategory.filter((c) => c.isGap);
  const weakest = perCategory
    .filter((c) => !c.isGap && c.score < 70)
    .sort((a, b) => a.score - b.score);

  let summary = '';
  const shortName = placeName.split(',')[0].trim();

  if (rating === 'Well-served') {
    summary = `${shortName} scores ${overall}/100 — a strong 15-minute neighborhood`;
    if (weakest.length > 0) {
      summary += `, though ${weakest[0].label.toLowerCase()} could be closer`;
    }
    summary += '.';
  } else if (rating === 'Moderately served') {
    summary = `${shortName} scores ${overall}/100 — moderately walkable`;
    if (gaps.length > 0) {
      summary += `, but missing ${gaps.map((g) => g.label.toLowerCase()).join(' and ')} nearby`;
    }
    summary += '.';
  } else {
    summary = `${shortName} scores ${overall}/100 — this area has significant accessibility gaps`;
    if (gaps.length > 0) {
      summary += `, notably lacking ${gaps.map((g) => g.label.toLowerCase()).join(', ')}`;
    }
    summary += '.';
  }

  return summary;
}
