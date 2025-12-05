export type LngLat = [number, number]; // [lng, lat]
export type PolygonRings = LngLat[][]; // [ [ [lng,lat], ... ] ]
export type MultiPolygonRings = LngLat[][][]; // [ [ [ [lng,lat], ... ] ] ]

export interface OSMBoundary {
  type: 'FeatureCollection';
  features: OSMFeature[];
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: PolygonRings;
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: MultiPolygonRings;
}

export type OSMGeometry = PolygonGeometry | MultiPolygonGeometry;

export interface OSMFeature {
  type: 'Feature';
  geometry: OSMGeometry;
  properties: Record<string, unknown>;
}

export interface OSMReverseGeocode {
  display_name?: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    hamlet?: string;
    county?: string;
    region?: string;
    postcode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  lat: string;
  lon: string;
  [key: string]: any;
}

export interface OSMSearchResult {
  place_id: number;
  osm_type: 'node' | 'way' | 'relation';
  osm_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
  importance: number;
  [key: string]: any;
}

export interface LocationData {
  lat: number;
  lng: number;
  neighborhood: string;
  /** Human-readable display name returned by OSM (display_name) */
  address?: string;
  /** Parsed address object from OSM reverse geocode (contains road, neighbourhood, suburb, etc.) */
  addressObj?: OSMReverseGeocode['address'];
}
