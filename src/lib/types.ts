// Shared TypeScript types for the Urban Amenity Accessibility Analyzer

export interface GeocodedPlace {
  displayName: string;
  lat: number;
  lon: number;
  boundingbox: [string, string, string, string];
  type: string;
}

export interface AmenityPoint {
  id: number;
  lat: number;
  lon: number;
  name: string;
  category: string;
}

export type GroupedAmenities = Record<string, AmenityPoint[]>;

export interface CategoryScore {
  categoryId: string;
  label: string;
  icon: string;
  color: string;
  score: number;
  nearestMeters: number;
  nearestMinutes: number;
  count: number;
  isGap: boolean;
}

export type Rating = 'Well-served' | 'Moderately served' | 'Underserved';

export interface ScoreResult {
  overall: number;
  rating: Rating;
  perCategory: CategoryScore[];
}

export interface SearchState {
  place: GeocodedPlace | null;
  radius: number; // meters
}
