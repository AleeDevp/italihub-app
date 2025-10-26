'use client';

import { LoadingSpinner } from '@/components/loading-spinner';
import type { City } from '@/types/city';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
const CityMap = dynamic(() => import('./city-map').then((m) => ({ default: m.CityMap })), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-lg border shadow-sm p-8 flex items-center justify-center bg-secondary/50"
      style={{ height: '400px' }}
    >
      <LoadingSpinner />
    </div>
  ),
});

interface CityMapWrapperProps {
  city: City | null | undefined;
  initialLat?: number | null;
  initialLng?: number | null;
  initialNeighborhood?: string | null;
  // onChange can accept an optional neighborhood third argument
  onChange: (lat: number, lng: number, neighborhood?: string | null) => void;
  // notify parent when map is performing async neighborhood lookup
  onPendingChange?: (pending: boolean) => void;
  // pass through the react-hook-form fieldState for the neighborhood field so
  // the lazy CityMap can render validation errors inline
  neighborhoodFieldState?: any;
}

/**
 * Wrapper component that handles:
 * - City data availability check
 * - Dynamic loading of the map component to avoid SSR issues
 */
export function CityMapWrapper({
  city,
  initialLat,
  initialLng,
  initialNeighborhood,
  onChange,
  onPendingChange,
  neighborhoodFieldState,
}: CityMapWrapperProps) {
  // If city is not available, show error message
  if (!city) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <p className="font-medium">Unable to load map</p>
        <p className="text-xs opacity-80">City information is not available. Please try again.</p>
      </div>
    );
  }

  return (
    <CityMap
      city={city}
      initialLat={initialLat}
      initialLng={initialLng}
      initialNeighborhood={initialNeighborhood}
      onChange={onChange}
      onPendingChange={onPendingChange}
      neighborhoodFieldState={neighborhoodFieldState}
    />
  );
}
