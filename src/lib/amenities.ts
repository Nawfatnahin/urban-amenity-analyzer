// Amenity category configuration — maps user-facing categories to OSM tags
// Verified against OSM Key:amenity and Key:leisure wikis

export interface AmenityCategory {
  id: string;
  label: string;
  icon: string;         // Lucide icon name
  emoji: string;        // Fallback emoji
  color: string;        // Hex color for markers
  weight: number;       // Importance weight in score (sums to 1.0)
  overpassFilters: string[]; // Raw Overpass QL tag filters
  idealMinutes: number; // Walk-time target for "full marks"
}

export const AMENITIES: AmenityCategory[] = [
  {
    id: 'education',
    label: 'Schools',
    icon: 'GraduationCap',
    emoji: '🏫',
    color: '#f59e0b',
    weight: 0.18,
    idealMinutes: 15,
    overpassFilters: ['["amenity"~"school|kindergarten|college"]'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: 'Heart',
    emoji: '🏥',
    color: '#ef4444',
    weight: 0.22,
    idealMinutes: 15,
    overpassFilters: ['["amenity"~"hospital|clinic|doctors"]', '["healthcare"]'],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacies',
    icon: 'Pill',
    emoji: '💊',
    color: '#10b981',
    weight: 0.12,
    idealMinutes: 10,
    overpassFilters: ['["amenity"="pharmacy"]'],
  },
  {
    id: 'groceries',
    label: 'Groceries',
    icon: 'ShoppingCart',
    emoji: '🛒',
    color: '#3b82f6',
    weight: 0.18,
    idealMinutes: 10,
    overpassFilters: ['["shop"~"supermarket|convenience|greengrocer"]'],
  },
  {
    id: 'parks',
    label: 'Parks & Green',
    icon: 'TreePine',
    emoji: '🌳',
    color: '#22c55e',
    weight: 0.15,
    idealMinutes: 10,
    overpassFilters: ['["leisure"~"park|garden|playground"]'],
  },
  {
    id: 'transit',
    label: 'Transit',
    icon: 'TrainFront',
    emoji: '🚉',
    color: '#8b5cf6',
    weight: 0.15,
    idealMinutes: 8,
    overpassFilters: [
      '["highway"="bus_stop"]',
      '["railway"~"station|tram_stop|subway_entrance"]',
      '["public_transport"="platform"]',
    ],
  },
];

// Invariant: weights must sum to 1.0
const weightSum = AMENITIES.reduce((sum, a) => sum + a.weight, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  console.warn(`Amenity weights sum to ${weightSum}, expected 1.0`);
}
