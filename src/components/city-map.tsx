'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { City } from '@/types/city';
import type { LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Search, X } from 'lucide-react';
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

// Constants
const CIRCLE_RADIUS_M = 400;
const SEARCH_DEBOUNCE_MS = 400;

// marker icon (leaflet needs explicit icon urls in many bundlers)
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type BBox = { minLat: number; maxLat: number; minLng: number; maxLng: number };

type SearchResult = { lat: number; lng: number; displayName: string; neighborhood?: string };

interface CityMapProps {
  city: City;
  initialLat?: number | null;
  initialLng?: number | null;
  initialNeighborhood?: string | null;
  onChange: (lat: number, lng: number, neighborhood?: string | null) => void;
  onPendingChange?: (pending: boolean) => void;
  neighborhoodFieldState?: { error?: { message?: string } } | any;
}

// --- Network helpers -------------------------------------------------
async function fetchCityBBox(cityName: string): Promise<BBox> {
  const params = new URLSearchParams({
    city: cityName,
    countrycodes: 'IT',
    limit: '1',
    format: 'json',
  });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'ItaliaHub-Housing-App/1.0' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Nominatim ${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  if (!Array.isArray(data) || data.length === 0) throw new Error('City not found');
  const place = data[0];
  if (!Array.isArray(place.boundingbox) || place.boundingbox.length < 4)
    throw new Error('Bounding box missing for city');
  const minLat = parseFloat(place.boundingbox[0]);
  const maxLat = parseFloat(place.boundingbox[1]);
  const minLng = parseFloat(place.boundingbox[2]);
  const maxLng = parseFloat(place.boundingbox[3]);
  if ([minLat, maxLat, minLng, maxLng].some((v) => Number.isNaN(v)))
    throw new Error('Invalid bounding box values');
  return { minLat, maxLat, minLng, maxLng };
}

async function postSearchProxy(body: Record<string, unknown>) {
  const res = await fetch('/api/map-search/nominatim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function searchLocations(
  query: string,
  cityName: string,
  bbox?: BBox
): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    const payload: Record<string, unknown> = { query: query.trim(), cityName };
    if (bbox) payload.bounds = bbox;
    const data = await postSearchProxy(payload);
    if (!data || data.error) return [];
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.error('searchLocations failed', err);
    return [];
  }
}

async function reverseGeocode(
  lat: number,
  lng: number,
  cityName: string,
  bbox?: BBox
): Promise<string> {
  try {
    const payload: Record<string, unknown> = { lat, lng, mode: 'reverse', cityName };
    if (bbox) payload.bounds = bbox;
    const data = await postSearchProxy(payload);
    if (!data || data.error) return '';
    return data.neighborhood || '';
  } catch (err) {
    console.error('reverseGeocode failed', err);
    return '';
  }
}

// --- Small helpers/hooks ----------------------------------------------
function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 300) {
  const t = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (t.current) clearTimeout(t.current);
    },
    []
  );
  return useCallback(
    (...args: Parameters<T>) => {
      if (t.current) clearTimeout(t.current);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      t.current = window.setTimeout(() => cb(...args), delay) as unknown as number;
    },
    [cb, delay]
  );
}

// --- Subcomponents ---------------------------------------------------
function SearchBox({
  cityName,
  bbox,
  onSelect,
}: {
  cityName: string;
  bbox?: BBox;
  onSelect: (r: SearchResult) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return setResults([]);
      setLoading(true);
      const res = await searchLocations(query, cityName, bbox);
      setResults(res);
      setLoading(false);
    },
    [cityName, bbox]
  );

  const debounced = useDebouncedCallback(doSearch, SEARCH_DEBOUNCE_MS);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center z-50">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            debounced(e.target.value);
            if (!e.target.value.trim()) setResults([]);
          }}
          placeholder={`Search in ${cityName}...`}
          className="pl-10 pr-10 w-full"
        />
        {q && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQ('');
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {loading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((r, idx) => (
            <button
              key={`${r.lat}-${r.lng}-${idx}`}
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm border-b last:border-b-0 hover:bg-accent/50"
              onClick={() => {
                onSelect(r);
                setQ('');
                setResults([]);
              }}
            >
              <div className="font-medium line-clamp-2">{r.displayName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Fit map to bbox and clamp zoom/panning
function FitToBBox({ box }: { box: BBox }) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!map || !box) return;
    const southWest = L.latLng(box.minLat, box.minLng);
    const northEast = L.latLng(box.maxLat, box.maxLng);
    const bounds = L.latLngBounds(southWest, northEast);
    // Fit bounds so the city is visible on initial render / box changes.
    // Only fit once to avoid overriding user zoom interactions
    if (!hasFitted.current) {
      map.fitBounds(bounds, { padding: [20, 20] });
      hasFitted.current = true;
    }

    // Restrict panning to the city bbox.
    map.setMaxBounds(bounds);
    try {
      // soften the hard edge when dragging
      (map as any).options.maxBoundsViscosity = 0.7;
    } catch {}

    // Calculate and set sensible min/max zoom so the bbox is fully visible but user can still zoom in.
    try {
      const computedMin = map.getBoundsZoom(bounds, false);
      map.setMinZoom(computedMin);
      // keep a reasonable upper bound for zooming in
      map.setMaxZoom(18);
    } catch {}

    return () => {
      try {
        map.setMaxBounds(undefined);
      } catch {}
    };
  }, [map, box]);
  return null;
}

function MapClickHandler({
  box,
  onPointClick,
}: {
  box: BBox;
  onPointClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      if (!(lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng))
        return;
      const map = this as unknown as L.Map;
      map.setZoom(18);
      map.panTo([lat, lng]);
      onPointClick(lat, lng);
    },
  });
  return null;
}

// small MapSetter moved here to avoid forward hoisting issues
function MapSetter({ setRef }: { setRef: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) setRef(map);
  }, [map, setRef]);
  return null;
}

export const CityMap = React.memo(function CityMap({
  city,
  initialLat,
  initialLng,
  initialNeighborhood,
  onChange,
  onPendingChange,
  neighborhoodFieldState,
}: CityMapProps) {
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [loadingBbox, setLoadingBbox] = useState(true);
  const [bboxError, setBboxError] = useState(false);
  const [neighborhood, setNeighborhood] = useState<string>(initialNeighborhood ?? '');
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);

  // selected position is reactive so Marker/Circle update visually
  const [selected, setSelected] = useState<{ lat: number; lng: number }>(() => ({
    lat: initialLat ?? city.lat ?? 0,
    lng: initialLng ?? city.lng ?? 0,
  }));

  const mapRef = useRef<L.Map | null>(null);

  const initialCenter = useMemo(
    () => [initialLat ?? city.lat ?? 0, initialLng ?? city.lng ?? 0] as [number, number],
    [initialLat, city.lat, initialLng, city.lng]
  );

  // fetch bbox
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBbox(true);
      setBboxError(false);
      try {
        const b = await fetchCityBBox(city.name);
        if (cancelled) return;
        setBbox(b);
        // if user didn't provide initial coords, center on bbox center
        if (initialLat == null && initialLng == null) {
          setSelected({ lat: (b.minLat + b.maxLat) / 2, lng: (b.minLng + b.maxLng) / 2 });
        }
      } catch (err) {
        console.error('Failed to fetch bbox', err);
        if (!cancelled) setBboxError(true);
      } finally {
        if (!cancelled) setLoadingBbox(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city.name, initialLat, initialLng]);

  // callbacks
  const notifyParent = useCallback(
    (lat: number, lng: number, n?: string | null) => {
      onChange?.(lat, lng, n ?? undefined);
    },
    [onChange]
  );

  const fetchNeighborhood = useCallback(
    async (lat: number, lng: number, neighborhoodFromSearch?: string) => {
      // Optimistically update selected position immediately
      setSelected({ lat, lng });

      if (neighborhoodFromSearch) {
        startTransition(() => {
          setNeighborhood(neighborhoodFromSearch);
        });
        notifyParent(lat, lng, neighborhoodFromSearch);
        return;
      }

      // Start loading in a transition to avoid blocking the UI
      startTransition(() => {
        setNeighborhoodLoading(true);
      });

      try {
        const n = await reverseGeocode(lat, lng, city.name, bbox ?? undefined);
        // Update neighborhood and notify parent in a transition
        startTransition(() => {
          setNeighborhood(n || '');
          setNeighborhoodLoading(false);
        });
        notifyParent(lat, lng, n || undefined);
      } catch (err) {
        console.error('Reverse geocode failed:', err);
        // Handle error gracefully, reset loading
        startTransition(() => {
          setNeighborhood('');
          setNeighborhoodLoading(false);
        });
        notifyParent(lat, lng, undefined);
      }
    },
    [city.name, bbox, notifyParent]
  );

  const onSearchSelect = useCallback(
    (r: SearchResult) => {
      startTransition(() => {
        fetchNeighborhood(r.lat, r.lng, r.neighborhood);
      });
    },
    [fetchNeighborhood]
  );

  // overlay rectangles for dimming outside bbox
  const overlayRects = useMemo(() => {
    if (!bbox) return [] as [[number, number], [number, number]][];
    return [
      // top
      [
        [90, -180],
        [bbox.maxLat, 180],
      ],
      // bottom
      [
        [bbox.minLat, -180],
        [-90, 180],
      ],
      // left
      [
        [bbox.minLat, -180],
        [bbox.maxLat, bbox.minLng],
      ],
      // right
      [
        [bbox.minLat, bbox.maxLng],
        [bbox.maxLat, 180],
      ],
    ];
  }, [bbox]);

  return (
    <div className="relative flex flex-col gap-4 w-full">
      <SearchBox cityName={city.name} bbox={bbox ?? undefined} onSelect={onSearchSelect} />

      <div className="rounded-lg overflow-hidden border shadow-sm z-0" style={{ height: 400 }}>
        {loadingBbox ? (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        ) : bboxError ? (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <p className="text-sm text-destructive">Failed to load map. Please try again.</p>
          </div>
        ) : bbox ? (
          <MapContainer
            center={initialCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            key={`${city.id}`}
            minZoom={3}
            maxZoom={18}
            zoomControl
            dragging
          >
            <MapSetter setRef={(m) => (mapRef.current = m)} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FitToBBox box={bbox} />

            <Rectangle
              bounds={[
                [bbox.minLat, bbox.minLng],
                [bbox.maxLat, bbox.maxLng],
              ]}
              pathOptions={{ color: '#3b82f6', weight: 2, fill: false }}
            />

            {overlayRects.map((b, i) => (
              <Rectangle
                key={i}
                bounds={b as [[number, number], [number, number]]}
                pathOptions={{
                  color: 'transparent',
                  fill: true,
                  fillColor: '#00000080',
                  fillOpacity: 0.4,
                  weight: 0,
                  interactive: false,
                }}
              />
            ))}

            <Circle
              center={[selected.lat, selected.lng]}
              radius={CIRCLE_RADIUS_M}
              pathOptions={{ color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.15, weight: 2 }}
            />
            <Marker position={[selected.lat, selected.lng]} icon={defaultIcon} />

            <MapClickHandler box={bbox} onPointClick={(lat, lng) => fetchNeighborhood(lat, lng)} />
          </MapContainer>
        ) : null}
      </div>

      <div className="absolute right-2 top-4 z-40 pointer-events-none">
        <div
          className={cn(
            'bg-white rounded-lg shadow-md px-3 py-2 text-xs font-medium border w-48 text-left flex items-center gap-2',
            neighborhoodFieldState && neighborhoodFieldState.error
              ? 'border-destructive ring-2 ring-destructive/30'
              : 'border-gray-200'
          )}
          aria-invalid={Boolean(neighborhoodFieldState && neighborhoodFieldState.error)}
        >
          <div className="flex-1">
            <div className="text-gray-600">Neighborhood</div>
            <div className="text-gray-900 font-semibold truncate">{neighborhood || '—'}</div>
            {neighborhoodFieldState && neighborhoodFieldState.error ? (
              <div className="text-destructive text-xs mt-1 w-full" role="alert">
                {neighborhoodFieldState.error?.message ?? 'Invalid neighborhood'}
              </div>
            ) : null}
          </div>
          <div className="w-5 h-5 flex items-center justify-center">
            {neighborhoodLoading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});
