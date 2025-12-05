'use client';

import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Props for the LocationMap component
 */
export interface LocationMapProps {
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Radius of the location marker circle in meters */
  markerRadius?: number;
  /** Optional extra class for the outer container */
  className?: string;
}

const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 12; // Minimum zoom out level
const MAX_ZOOM = 16; // Maximum zoom in level

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

function LocationMapContent({ lat, lng, markerRadius = 300, className }: LocationMapProps) {
  const { MapContainer, TileLayer, Circle, useMap } = require('react-leaflet');
  const L = require('leaflet');
  const [mapInstance, setMapInstance] = React.useState<LeafletMap | null>(null);

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

  function MapController({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap() as LeafletMap;

    React.useEffect(() => {
      setupLeafletIcons();
      setMapInstance(map);
      try {
        // Center the map on the location
        map.setView([lat, lng], DEFAULT_ZOOM);
      } catch (err: unknown) {
        console.error('Failed to center map:', err);
      }
    }, [lat, lng, map]);

    return null;
  }

  const handleResetView = () => {
    if (mapInstance) {
      mapInstance.setView([lat, lng], DEFAULT_ZOOM, { animate: true });
    }
  };

  const center: [number, number] = [lat, lng];

  return (
    <div
      className={`relative w-full h-full rounded-3xl overflow-hidden border border-input shadow-sm ${className ?? ''}`}
    >
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
        className="z-0"
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={MAX_ZOOM}
        />

        {/* Location marker with circle radius */}
        <Circle
          center={center}
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

        {/* Center marker for location */}
        <Circle
          center={center}
          radius={Math.max(markerRadius * 0.02, 6)}
          pathOptions={{
            color: 'rgb(16, 185, 129)',
            fillOpacity: 1,
          }}
        />

        <MapController lat={lat} lng={lng} />
      </MapContainer>

      {/* Reset View Button */}
      <button
        onClick={handleResetView}
        className="absolute bottom-4 right-4 z-40 bg-white hover:bg-gray-50 rounded-lg p-2.5 shadow-lg border border-gray-200 transition-all hover:shadow-xl"
        title="Reset map view"
        aria-label="Reset map view"
      >
        <RotateCcw className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}

const MemoizedLocationMapContent = React.memo(LocationMapContent, (prevProps, nextProps) => {
  // Only re-render if coordinates or radius change
  return (
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.markerRadius === nextProps.markerRadius &&
    prevProps.className === nextProps.className
  );
});

export const LocationMap = dynamic<LocationMapProps>(
  () => Promise.resolve(MemoizedLocationMapContent),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  }
);

LocationMap.displayName = 'LocationMap';
