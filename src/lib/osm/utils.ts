import type { LngLat, OSMBoundary, OSMFeature } from './types';

export function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let isInside = false;
  const x = lng;
  const y = lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;
  }

  return isInside;
}

export function extractPolygonCoordinates(boundary: OSMBoundary): [number, number][][] {
  const collect: [number, number][][] = [];

  if (!boundary.features?.length) {
    console.warn('No features in boundary');
    return collect;
  }

  const pushOuterRing = (ring: LngLat[]) => {
    if (!Array.isArray(ring) || ring.length === 0) return;
    const converted: [number, number][] = [];
    for (const pair of ring) {
      const [lng, lat] = pair;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        console.warn('Skipping invalid coordinate', pair);
        continue;
      }
      converted.push([lat, lng]);
    }
    if (converted.length) collect.push(converted);
  };

  for (const feature of boundary.features as OSMFeature[]) {
    try {
      if (feature.geometry.type === 'Polygon') {
        const rings = feature.geometry.coordinates; // outer + holes
        if (Array.isArray(rings) && rings[0]) pushOuterRing(rings[0]);
      } else if (feature.geometry.type === 'MultiPolygon') {
        const polys = feature.geometry.coordinates; // array of polygons
        if (Array.isArray(polys)) {
          for (const poly of polys) {
            if (Array.isArray(poly) && poly[0]) pushOuterRing(poly[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting polygon coordinates:', error);
    }
  }

  if (collect.length === 0) {
    console.warn('No valid polygons extracted from boundary');
    return collect;
  }

  // Sort polygons by approximate area (descending) so index 0 is the largest
  const area = (poly: [number, number][]) => {
    // Shoelace formula on lng/lat (rough compare only)
    let sum = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const x1 = poly[j][1];
      const y1 = poly[j][0];
      const x2 = poly[i][1];
      const y2 = poly[i][0];
      sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) * 0.5;
  };
  collect.sort((a, b) => area(b) - area(a));
  return collect;
}

export function calculateBounds(polygon: [number, number][]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  polygon.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  return { minLat, maxLat, minLng, maxLng };
}
