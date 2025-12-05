/**
 * Hook for managing Step 6 location selection
 *
 * Handles:
 * - City boundary fetching and caching (persists across unmounts)
 * - Reverse geocoding on map click
 * - Search result handling
 * - Boundary validation
 * - Loading and error states
 * - State persistence to avoid refetching on step revisit
 */

import { fetchCityBoundary, reverseGeocode } from '@/lib/osm/client';
import type { LocationData, OSMBoundary, OSMSearchResult } from '@/lib/osm/types';
import { extractPolygonCoordinates, isPointInPolygon } from '@/lib/osm/utils';
import type { City } from '@/types/city';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface LocationStepState {
  boundary: OSMBoundary | null;
  selectedLocation: { lat: number; lng: number } | null;
  pendingLocation: { lat: number; lng: number } | null;
  /** Human-readable neighborhood string derived from the parsed address */
  neighborhood: string | null;
  /** Raw parsed address object returned by OSM reverse geocode */
  address: LocationData['addressObj'] | null;
  isLoadingBoundary: boolean;
  isLoadingLocation: boolean;
  error: string | null;
  isMapPending: boolean;
}

export interface LocationStepActions {
  handleMapClick: (lat: number, lng: number) => Promise<void>;
  handleSearchSelect: (result: OSMSearchResult) => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
  refetchBoundary: () => Promise<void>;
}

// Module-level cache to persist boundary data across component remounts
// This ensures we don't refetch boundaries when user navigates between steps
const globalBoundaryCache = new Map<number, OSMBoundary>();

/**
 * Validates if coordinates are valid finite numbers
 */
function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

/**
 * Custom hook for managing location selection in Step 6 of the housing form.
 *
 * Features:
 * - Fetches and caches city boundaries (persists across unmounts)
 * - Validates locations are within city boundaries
 * - Handles reverse geocoding for address extraction
 * - Manages loading and error states
 * - Provides map click and search result handlers
 *
 * @param city - The city object containing id and name for boundary fetching
 * @returns A tuple containing [state, actions] for location management
 *
 * @example
 * ```tsx
 * const [state, actions] = useLocationStep(userCity);
 * const { handleMapClick, handleSearchSelect } = actions;
 *
 * <LocationMapViewer
 *   boundary={state.boundary}
 *   selectedLocation={state.selectedLocation}
 *   onMapClick={handleMapClick}
 *   isLoading={state.isLoadingBoundary}
 * />
 * ```
 */
export function useLocationStep(
  city: City | null
): readonly [state: LocationStepState, actions: LocationStepActions] {
  const [state, setState] = useState<LocationStepState>({
    boundary: null,
    selectedLocation: null,
    pendingLocation: null,
    neighborhood: null,
    address: null,
    isLoadingBoundary: false,
    isLoadingLocation: false,
    error: null,
    isMapPending: false,
  });

  // Track if boundary fetch is in progress to prevent duplicate requests
  const fetchInProgressRef = useRef<number | null>(null);

  // Fetch city boundary on mount or city change
  useEffect(() => {
    if (!city) {
      setState((prev) => ({
        ...prev,
        boundary: null,
        error: 'City not found',
        isLoadingBoundary: false,
      }));
      return;
    }

    // Check global cache first
    if (globalBoundaryCache.has(city.id)) {
      const cached = globalBoundaryCache.get(city.id);
      setState((prev) => ({
        ...prev,
        boundary: cached ?? null,
        error: null,
        isLoadingBoundary: false,
      }));
      return;
    }

    // Prevent duplicate fetches for the same city
    if (fetchInProgressRef.current === city.id) {
      return;
    }

    // Fetch boundary
    const fetchBoundary = async () => {
      fetchInProgressRef.current = city.id;
      setState((prev) => ({ ...prev, isLoadingBoundary: true, error: null }));

      try {
        const boundary = await fetchCityBoundary(city.name);

        if (!boundary || !boundary.features || boundary.features.length === 0) {
          const errorMsg = `Could not load boundary for ${city.name}`;
          setState((prev) => ({
            ...prev,
            boundary: null,
            error: errorMsg,
            isLoadingBoundary: false,
          }));
          fetchInProgressRef.current = null;
          return;
        }

        // Cache the boundary globally
        globalBoundaryCache.set(city.id, boundary);

        setState((prev) => ({ ...prev, boundary, error: null, isLoadingBoundary: false }));
        fetchInProgressRef.current = null;
      } catch (err: unknown) {
        // Use console.warn to avoid triggering Next.js error overlay for expected errors
        console.warn(
          '[Location Step] Failed to fetch city boundary:',
          err instanceof Error ? err.message : String(err)
        );
        const msg =
          err instanceof Error ? err.message : 'Failed to load city boundary. Please try again.';
        setState((prev) => ({ ...prev, boundary: null, error: msg, isLoadingBoundary: false }));
        fetchInProgressRef.current = null;
      }
    };

    void fetchBoundary();
  }, [city]);

  // Validate if location is within city boundary
  const isLocationInCity = useCallback(
    (lat: number, lng: number): boolean => {
      if (!state.boundary || !state.boundary.features || state.boundary.features.length === 0) {
        return false;
      }

      const polygons = extractPolygonCoordinates(state.boundary);
      if (!polygons.length || !polygons[0] || polygons[0].length === 0) {
        return false;
      }

      // Check against main polygon
      return isPointInPolygon(lat, lng, polygons[0]);
    },
    [state.boundary]
  );

  // Handle map click
  const handleMapClick = useCallback(
    async (lat: number, lng: number): Promise<void> => {
      // Validate coordinates
      if (!isValidCoordinate(lat, lng)) {
        setState((prev) => ({ ...prev, error: 'Invalid coordinates provided' }));
        return;
      }

      // Validate location is within city
      if (!isLocationInCity(lat, lng)) {
        setState((prev) => ({ ...prev, error: 'Location must be within the city boundary' }));
        return;
      }

      // Set pending location immediately for instant map feedback
      setState((prev) => ({
        ...prev,
        pendingLocation: { lat, lng },
        isMapPending: true,
        error: null,
      }));

      try {
        const locationData = await reverseGeocode(lat, lng);

        if (!locationData?.neighborhood) {
          throw new Error('Failed to get location details');
        }

        setState((prev) => ({
          ...prev,
          selectedLocation: { lat: locationData.lat, lng: locationData.lng },
          neighborhood: locationData.neighborhood,
          address: locationData.addressObj ?? null,
          error: null,
          isMapPending: false,
          pendingLocation: null,
        }));
      } catch (err: unknown) {
        console.warn(
          '[Location Step] Failed to process map click:',
          err instanceof Error ? err.message : String(err)
        );
        const msg =
          err instanceof Error ? err.message : 'Failed to process location. Please try again.';
        setState((prev) => ({
          ...prev,
          error: msg,
          isMapPending: false,
          pendingLocation: null,
        }));
      }
    },
    [isLocationInCity]
  );

  // Handle search result selection
  const handleSearchSelect = useCallback(
    async (result: OSMSearchResult): Promise<void> => {
      // Validate result format
      if (!result?.lat || !result?.lon) {
        setState((prev) => ({ ...prev, error: 'Invalid search result format' }));
        return;
      }

      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      // Validate parsed coordinates
      if (!isValidCoordinate(lat, lng)) {
        setState((prev) => ({ ...prev, error: 'Invalid coordinates from search result' }));
        return;
      }

      // Validate location is within city
      if (!isLocationInCity(lat, lng)) {
        setState((prev) => ({ ...prev, error: 'Selected location is outside the city boundary' }));
        return;
      }

      setState((prev) => ({ ...prev, isMapPending: true, error: null }));

      try {
        const locationData = await reverseGeocode(lat, lng);

        if (!locationData?.neighborhood) {
          throw new Error('Failed to get location details');
        }

        setState((prev) => ({
          ...prev,
          selectedLocation: { lat: locationData.lat, lng: locationData.lng },
          neighborhood: locationData.neighborhood,
          address: locationData.addressObj ?? null,
          error: null,
          isMapPending: false,
        }));
      } catch (err: unknown) {
        console.warn(
          '[Location Step] Failed to process search result:',
          err instanceof Error ? err.message : String(err)
        );
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to process selected location. Please try again.';
        setState((prev) => ({ ...prev, error: msg, isMapPending: false }));
      }
    },
    [isLocationInCity]
  );

  // Manual error setter
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  // Refetch boundary (useful for retry functionality)
  const refetchBoundary = useCallback(async (): Promise<void> => {
    if (!city) {
      console.warn('[Location Step] Cannot refetch boundary: city is null');
      return;
    }

    // Clear cache and fetch fresh
    globalBoundaryCache.delete(city.id);
    fetchInProgressRef.current = city.id;
    setState((prev) => ({ ...prev, isLoadingBoundary: true, error: null }));

    try {
      const boundary = await fetchCityBoundary(city.name);

      if (!boundary?.features?.length) {
        throw new Error(`Could not load boundary for ${city.name}`);
      }

      globalBoundaryCache.set(city.id, boundary);
      setState((prev) => ({ ...prev, boundary, isLoadingBoundary: false, error: null }));
    } catch (err: unknown) {
      console.warn(
        '[Location Step] Failed to refetch city boundary:',
        err instanceof Error ? err.message : String(err)
      );
      const msg =
        err instanceof Error ? err.message : 'Failed to load city boundary. Please try again.';
      setState((prev) => ({ ...prev, boundary: null, error: msg, isLoadingBoundary: false }));
    } finally {
      fetchInProgressRef.current = null;
    }
  }, [city]);

  // Reset function
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedLocation: null,
      neighborhood: null,
      address: null,
      error: null,
      isMapPending: false,
    }));
  }, []);

  return [
    state,
    {
      handleMapClick,
      handleSearchSelect,
      setError,
      refetchBoundary,
      reset,
    },
  ] as const;
}
