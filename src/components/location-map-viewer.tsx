'use client';

import 'leaflet/dist/leaflet.css';
import { CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useRef } from 'react';
import { FaRoad } from 'react-icons/fa';
import { MdLocationCity } from 'react-icons/md';
import { toast } from 'sonner';

import type { OSMBoundary } from '@/lib/osm/types';
import type { LatLngBoundsExpression, Map as LeafletMap, LeafletMouseEvent } from 'leaflet';

/**
 * Props for the LocationMapViewer component
 */
export interface LocationMapViewerProps {
  /** City boundary GeoJSON data from OpenStreetMap */
  boundary: OSMBoundary | null;
  /** Currently selected location coordinates */
  selectedLocation: { lat: number; lng: number } | null;
  /** Pending location coordinates (while processing) */
  pendingLocation?: { lat: number; lng: number } | null;
  /** Parsed address object from OSM reverse geocode (contains road, neighbourhood, suburb, etc.) */
  address?: { [key: string]: string | undefined } | null;
  /** Whether to show validation error styling on the map */
  showValidationError?: boolean;
  /** Validation error message to display */
  validationMessage?: string | null;
  /** Callback fired when user clicks on the map */
  onMapClick: (lat: number, lng: number) => void;
  /** Whether the boundary is currently loading */
  isLoading?: boolean;
  /** Whether the map is processing a location (reverse geocoding) */
  isMapPending?: boolean;
  /** Radius of the location marker circle in meters */
  markerRadius?: number;
  /** Optional extra class for the outer container */
  className?: string;
}

function MapLoadingFallback() {
  return (
    <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-input shadow-sm bg-muted">
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    </div>
  );
}

// Ensure Leaflet default icons are configured only once per browser session
let leafletIconsConfigured = false;

function LocationMapViewerContent({
  boundary,
  selectedLocation,
  pendingLocation,
  address,
  showValidationError = false,
  validationMessage = null,
  onMapClick,
  isLoading = false,
  isMapPending = false,
  markerRadius = 300,
  className,
}: LocationMapViewerProps) {
  const { MapContainer, TileLayer, Polygon, Circle, useMap } = require('react-leaflet');
  const L = require('leaflet');
  const { calculateBounds, extractPolygonCoordinates } = require('@/lib/osm/utils');

  const boundsInitializedRef = useRef(false);

  function setupLeafletIcons(): void {
    if (leafletIconsConfigured) return;
    try {
      // remove internal _getIconUrl if present (Leaflet internals differ between versions)
      const iconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
      delete iconPrototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      leafletIconsConfigured = true;
    } catch (err: unknown) {
      console.warn('Failed to setup Leaflet icons:', err);
    }
  }

  function MapController({
    boundary,
    pendingLocation,
    selectedLocation,
    onMapClick,
    isMapPending,
  }: {
    boundary: LocationMapViewerProps['boundary'];
    pendingLocation?: LocationMapViewerProps['pendingLocation'];
    selectedLocation?: LocationMapViewerProps['selectedLocation'];
    onMapClick: (lat: number, lng: number) => void;
    isMapPending?: boolean;
  }) {
    const map = useMap() as LeafletMap;
    const clickRef = useRef<((e: LeafletMouseEvent) => void) | null>(null);
    const lastCenteredRef = useRef<string | null>(null);

    // Initialize bounds when boundary is loaded for the first time
    useEffect(() => {
      if (
        boundsInitializedRef.current ||
        !boundary ||
        !boundary.features?.length ||
        pendingLocation ||
        selectedLocation
      )
        return;
      setupLeafletIcons();
      try {
        const polygons = extractPolygonCoordinates(boundary);
        if (!polygons.length) return;
        const mainPolygon = polygons[0];
        if (!mainPolygon?.length) return;
        const bounds = calculateBounds(mainPolygon);
        const paddingLat = (bounds.maxLat - bounds.minLat) * 0.1;
        const paddingLng = (bounds.maxLng - bounds.minLng) * 0.1;
        const fitBounds = L.latLngBounds([
          [bounds.minLat - paddingLat, bounds.minLng - paddingLng],
          [bounds.maxLat + paddingLat, bounds.maxLng + paddingLng],
        ] as LatLngBoundsExpression);
        map.fitBounds(fitBounds, { padding: [50, 50], maxZoom: 18 });

        // Restrict map panning to city bounds
        try {
          map.setMaxBounds(fitBounds);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.options.maxBoundsViscosity = 1;
        } catch (err: unknown) {
          // ignore if map implementation differs
          console.warn('Could not set max bounds:', err);
        }

        map.setMinZoom(12);
        map.setMaxZoom(17);
        boundsInitializedRef.current = true;
      } catch (err: unknown) {
        console.error('Failed to initialize map bounds:', err);
        // keep map usable
      }
    }, [boundary, pendingLocation, selectedLocation, map]);

    // Handle map click events
    useEffect(() => {
      const handler = (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          onMapClick(lat, lng);
        }
      };
      if (clickRef.current) map.off('click', clickRef.current);
      clickRef.current = handler;
      map.on('click', clickRef.current);
      return () => {
        if (clickRef.current) map.off('click', clickRef.current);
      };
    }, [map, onMapClick]);

    // Handle tile loading errors
    useEffect(() => {
      const handleTileError = () => {
        toast.error('Map Tiles Error', {
          description:
            'Some map tiles failed to load. Please check your connection or try again later.',
          duration: 5000,
        });
      };

      map.on('tileerror', handleTileError);

      return () => {
        map.off('tileerror', handleTileError);
      };
    }, [map]);

    // Center map on selected location with smooth animation
    useEffect(() => {
      if (!selectedLocation) return;
      // wait until any pending operations are done
      if (pendingLocation) return;
      if (isMapPending) return;

      const key = `${selectedLocation.lat.toFixed(6)},${selectedLocation.lng.toFixed(6)}`;
      if (lastCenteredRef.current === key) return;
      lastCenteredRef.current = key;

      try {
        const currentZoom = map.getZoom();
        const targetZoom = Math.max(currentZoom ?? 12, 16);
        // Use flyTo for smooth transition
        map.flyTo([selectedLocation.lat, selectedLocation.lng], targetZoom, { duration: 0.55 });
      } catch (err: unknown) {
        // fallback: set view without animation
        console.warn('Failed to animate to selected location, using setView:', err);
        try {
          map.setView([selectedLocation.lat, selectedLocation.lng]);
        } catch (_e: unknown) {
          console.error('Failed to center map on selected location:', _e);
        }
      }
    }, [selectedLocation, pendingLocation, isMapPending, map]);

    return null;
  }

  const polygons = useMemo(
    () => extractPolygonCoordinates(boundary || { type: 'FeatureCollection', features: [] }),
    [boundary]
  );
  const mainPolygon = polygons[0];
  const defaultCenter: [number, number] = [41.8719, 12.5674];

  // Precompute a world-covering rectangle used to create a hole mask for the city polygon
  const outerWorldRect = useMemo(
    () =>
      [
        [-90, -180],
        [90, -180],
        [90, 180],
        [-90, 180],
      ] as [number, number][],
    []
  );

  // Extract address fields with fallbacks
  const streetName =
    address?.road ??
    address?.street ??
    address?.pedestrian ??
    address?.residential ??
    'Not available';

  const neighborhoodName =
    address?.neighbourhood ??
    address?.suburb ??
    address?.village ??
    address?.town ??
    address?.city ??
    'Not available';

  return (
    <div
      className={`relative w-full h-full rounded-lg overflow-hidden border shadow-sm ${
        showValidationError ? 'border-destructive ring-2 ring-destructive/60' : 'border-input'
      } ${className ?? ''}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
        preferCanvas={false}
        // Disable the default Leaflet zoom control (removes zoom in/out buttons on the left)
        zoomControl={false}
        // Disable Leaflet's default attribution control so we can render a custom,
        // visually-subtle attribution badge that still preserves required credits.
        attributionControl={false}
      >
        <TileLayer
          // Use CartoDB Voyager for a more contrasted, balanced basemap (less washed-out than Positron)
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        {mainPolygon && Array.isArray(mainPolygon) && mainPolygon.length > 2 && (
          <>
            {/* Draw a subtle stroke for the city boundary (no fill) */}
            <Polygon
              positions={mainPolygon}
              pathOptions={{
                color: 'rgb(59, 130, 246)',
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0,
              }}
            />

            {/* Mask area outside the city by drawing a world-rect with the city ring as a hole */}
            <Polygon
              positions={[outerWorldRect, mainPolygon]}
              pathOptions={{
                color: '#000000',
                weight: 0,
                fillColor: '#000000',
                fillOpacity: 0.45,
                interactive: false,
              }}
            />
          </>
        )}

        {pendingLocation && (
          <>
            <Circle
              center={[pendingLocation.lat, pendingLocation.lng]}
              radius={markerRadius}
              pathOptions={{
                color: 'rgb(59, 130, 246)',
                weight: 2,
                opacity: 0.9,
                fillColor: 'rgb(59, 130, 246)',
                fillOpacity: 0.12,
                dashArray: '6 6',
              }}
            />
            {/* center marker for the radius */}
            <Circle
              center={[pendingLocation.lat, pendingLocation.lng]}
              radius={Math.max(markerRadius * 0.02, 6)}
              pathOptions={{
                color: 'rgb(59, 130, 246)',
                fillOpacity: 1,
              }}
            />
            {/* small pixel-sized circle marker for crisp center dot (uses CircleMarker via Circle with small radius in meters) */}
          </>
        )}

        {selectedLocation && !pendingLocation && (
          <>
            <Circle
              center={[selectedLocation.lat, selectedLocation.lng]}
              radius={markerRadius}
              pathOptions={{
                color: 'rgb(16, 185, 129)',
                weight: 3,
                opacity: 0.95,
                fillColor: 'rgb(16, 185, 129)',
                fillOpacity: 0.14,
                dashArray: '6 6',
              }}
            />
            {/* center marker for selected location */}
            <Circle
              center={[selectedLocation.lat, selectedLocation.lng]}
              radius={Math.max(markerRadius * 0.02, 6)}
              pathOptions={{
                color: 'rgb(16, 185, 129)',
                fillOpacity: 1,
              }}
            />
          </>
        )}

        <MapController
          boundary={boundary}
          pendingLocation={pendingLocation}
          selectedLocation={selectedLocation}
          onMapClick={onMapClick}
          isMapPending={isMapPending}
        />
      </MapContainer>

      {/* Selected Location Details overlay on the bottom right side of the map - Neighborhood and Street */}
      <div className="absolute bottom-2 right-2 z-20 max-w-[92vw] sm:bottom-4 sm:right-4 sm:max-w-[300px]">
        {address ? (
          <div className="bg-white/95 border border-neutral-200 rounded-lg p-2 sm:p-3 shadow-sm w-full">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase text-neutral-400 tracking-wide">Selected</div>
                <div className="text-xs sm:text-sm font-medium text-foreground">Location</div>
              </div>
              <div className="text-emerald-600">
                {/* small, subtle check */}
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            <div className="mt-2 sm:mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MdLocationCity className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-400" />
                  <div className="text-[10px] sm:text-xs text-neutral-500">Neighborhood</div>
                </div>
                <div className="ml-2">
                  <div className="text-xs sm:text-sm text-foreground px-2 py-0.5 sm:px-3 sm:py-1 border border-neutral-100 rounded-md bg-neutral-50 max-w-[120px] sm:max-w-[160px] truncate">
                    {neighborhoodName}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FaRoad className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-400" />
                  <div className="text-[10px] sm:text-xs text-neutral-500">Street</div>
                </div>
                <div className="ml-2">
                  <div className="text-xs sm:text-sm text-foreground px-2 py-0.5 sm:px-3 sm:py-1 border border-neutral-100 rounded-md bg-neutral-50 max-w-[120px] sm:max-w-[160px] truncate">
                    {streetName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 border border-neutral-200 rounded-md px-3 py-2 text-xs text-neutral-500">
            Click on the map to select a location
          </div>
        )}
      </div>

      {showValidationError && validationMessage && (
        <div className="absolute bottom-3 right-3 z-20 bg-destructive/10 text-destructive text-xs px-3 py-2 rounded">
          {validationMessage}
        </div>
      )}

      {/* Custom attribution badge (keeps required credits but less obtrusive) */}
      {/* <div className="absolute bottom-1 left-1 z-10 pointer-events-none">
        <div className="text-[10px] text-neutral-400 bg-background/70 px-2 py-1 rounded-md backdrop-blur-sm">
          Leaflet | © OpenStreetMap contributors © CARTO
        </div>
      </div> */}

      {isMapPending && (
        <div className="absolute inset-0 flex items-center justify-center z-[2000] pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-background/80 rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-sm text-primary">Processing location...</p>
          </div>
        </div>
      )}
    </div>
  );
}

const MemoizedLocationMapViewerContent = React.memo(
  LocationMapViewerContent,
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    // Only re-render if these specific props change

    // Compare boundary references
    if (prevProps.boundary !== nextProps.boundary) return false;

    // Compare selected location
    if (prevProps.selectedLocation?.lat !== nextProps.selectedLocation?.lat) return false;
    if (prevProps.selectedLocation?.lng !== nextProps.selectedLocation?.lng) return false;

    // Compare pending location
    if (prevProps.pendingLocation?.lat !== nextProps.pendingLocation?.lat) return false;
    if (prevProps.pendingLocation?.lng !== nextProps.pendingLocation?.lng) return false;

    // Compare loading states
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.isMapPending !== nextProps.isMapPending) return false;

    // Compare validation states
    if (prevProps.showValidationError !== nextProps.showValidationError) return false;
    if (prevProps.validationMessage !== nextProps.validationMessage) return false;

    // Compare marker radius
    if (prevProps.markerRadius !== nextProps.markerRadius) return false;

    // Compare className
    if (prevProps.className !== nextProps.className) return false;

    // Address comparison - use deep equality check
    const prevAddressStr = prevProps.address ? JSON.stringify(prevProps.address) : null;
    const nextAddressStr = nextProps.address ? JSON.stringify(nextProps.address) : null;
    if (prevAddressStr !== nextAddressStr) return false;

    // All comparisons passed, props are equal
    return true;
  }
);

export const LocationMapViewer = dynamic<LocationMapViewerProps>(
  () => Promise.resolve(MemoizedLocationMapViewerContent),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  }
);

LocationMapViewer.displayName = 'LocationMapViewer';
