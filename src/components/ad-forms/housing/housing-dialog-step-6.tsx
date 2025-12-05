'use client';

import type { City } from '@/types/city';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Controller, type Control, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { LocationMapViewer } from '@/components/location-map-viewer';
import { LocationSearch } from '@/components/location-search';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocationStep } from '@/hooks/use-location-step';
import type { OSMSearchResult } from '@/lib/osm/types';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import { FaLocationDot } from 'react-icons/fa6';

/**
 * Props for the Housing Dialog Step 6 component
 */
export interface HousingDialogStep6Props {
  /** React Hook Form control object */
  control: Control<HousingFormValues>;
  /** The user's city for boundary validation */
  userCity: City | null;
  /** Function to revalidate a specific form field */
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
  /** React Hook Form instance */
  form: UseFormReturn<HousingFormValues>;
  /** Map validation error message to display */
  mapValidationError?: string | null;
  /** Function to clear the map validation error */
  clearMapValidationError?: () => void;
}

/**
 * Step 6: Location Selection
 *
 * Features:
 * - Interactive map with city boundary
 * - Click-to-select location (400m radius marker)
 * - Address search with autocomplete
 * - Reverse geocoding for neighborhood extraction
 * - Boundary validation
 * - Real-time form updates
 */
function HousingDialogStep6Component({
  control,
  userCity,
  revalidateField,
  form,
  mapValidationError,
  clearMapValidationError,
}: HousingDialogStep6Props) {
  const [state, actions] = useLocationStep(userCity);
  const { handleMapClick, handleSearchSelect } = actions;
  const hasInitializedRef = React.useRef(false);

  // Key to force remount the map when it becomes visible after being hidden
  const [mapKey, setMapKey] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wasHiddenRef = React.useRef(false);
  const lastErrorRef = React.useRef<string | null>(null);
  const boundaryErrorRef = React.useRef<string | null>(null);

  // Track if error is a boundary loading error (to show in critical section)
  useEffect(() => {
    if (state.error && !state.boundary && state.isLoadingBoundary === false) {
      // This is a boundary loading error
      boundaryErrorRef.current = state.error;
    } else if (state.boundary) {
      // Boundary loaded successfully, clear boundary error
      boundaryErrorRef.current = null;
    }
  }, [state.error, state.boundary, state.isLoadingBoundary]);

  // Handle fetching errors with toast notifications
  useEffect(() => {
    if (!state.error || state.error === lastErrorRef.current) {
      if (!state.error) lastErrorRef.current = null;
      return;
    }

    // Skip boundary loading errors (shown in critical section)
    if (state.error === boundaryErrorRef.current) return;

    // Check if this is a validation error (shown in alert section)
    const isValidationError =
      state.error.includes('boundary') ||
      state.error.includes('outside') ||
      state.error.includes('within the city');

    if (isValidationError) return;

    // This is a fetching/processing error - show toast
    lastErrorRef.current = state.error;

    // Categorize and show appropriate toast
    const isFetchError =
      state.error.includes('timed out') ||
      state.error.includes('Reverse geocoding failed') ||
      state.error.includes('Failed to get location details') ||
      state.error.includes('Failed to process');

    const isInvalidError = state.error.includes('Invalid');

    if (isFetchError) {
      toast.error('Processing Error', {
        description: 'Unable to get location details. Please try selecting a different location.',
        duration: 4000,
      });
    } else if (isInvalidError) {
      toast.error('Invalid Location', {
        description: state.error,
        duration: 4000,
      });
    } else {
      toast.error('Location Error', {
        description: state.error,
        duration: 4000,
      });
    }

    // Clear error after brief delay to keep map functional
    const timeoutId = setTimeout(() => actions.setError(null), 100);
    return () => clearTimeout(timeoutId);
  }, [state.error, actions]);

  // Detect when the component becomes visible after being hidden
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && wasHiddenRef.current) {
            // Component just became visible after being hidden
            // Remount the map to fix tile loading issues
            setMapKey((prev) => prev + 1);
            wasHiddenRef.current = false;
          } else if (!entry.isIntersecting) {
            // Component is hidden
            wasHiddenRef.current = true;
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Sync location data to form fields (consolidated for better performance)
  useEffect(() => {
    const updates: Array<{ field: keyof HousingFormValues; value: any }> = [];

    // Update address fields
    if (state.address) {
      const neighborhoodValue =
        state.address.neighbourhood ??
        state.address.suburb ??
        state.address.village ??
        state.address.town ??
        state.address.city ??
        '';
      const streetValue = state.address.road ?? '';

      if (form.getValues('neighborhood') !== neighborhoodValue) {
        updates.push({ field: 'neighborhood', value: neighborhoodValue });
      }
      if (form.getValues('streetHint') !== streetValue) {
        updates.push({ field: 'streetHint', value: streetValue || undefined });
      }
    }

    // Update coordinates
    if (state.selectedLocation) {
      if (form.getValues('lat') !== state.selectedLocation.lat) {
        updates.push({ field: 'lat', value: state.selectedLocation.lat });
      }
      if (form.getValues('lng') !== state.selectedLocation.lng) {
        updates.push({ field: 'lng', value: state.selectedLocation.lng });
      }
    }

    // Batch update form fields
    if (updates.length > 0) {
      updates.forEach(({ field, value }) => {
        form.setValue(field, value, {
          shouldDirty: true,
          shouldValidate: true,
        });
      });

      // Revalidate all updated fields
      void Promise.all(updates.map(({ field }) => revalidateField(field)));
    }
  }, [state.address, state.selectedLocation, form, revalidateField]);

  // Initialize location from existing form values on mount
  useEffect(() => {
    // Only initialize once and when boundary is ready
    if (
      hasInitializedRef.current ||
      !state.boundary ||
      state.isLoadingBoundary ||
      state.selectedLocation
    ) {
      return;
    }

    const lat = form.getValues('lat');
    const lng = form.getValues('lng');

    // Validate we have valid coordinates
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      hasInitializedRef.current = true;
      return;
    }

    hasInitializedRef.current = true;

    // Restore location via search handler
    const restoreLocation: OSMSearchResult = {
      place_id: 0,
      osm_type: 'node',
      osm_id: 0,
      name: '',
      display_name: '',
      lat: String(lat),
      lon: String(lng),
      boundingbox: [String(lat), String(lat), String(lng), String(lng)],
      importance: 0,
    };

    void handleSearchSelect(restoreLocation).catch((err) => {
      console.warn('[Location Init] Failed to restore location:', err);
    });
  }, [state.boundary, state.isLoadingBoundary, state.selectedLocation, form, handleSearchSelect]);

  if (!userCity) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>City information not available</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show critical error section ONLY for boundary loading failures
  if (boundaryErrorRef.current && !state.boundary && !state.isLoadingBoundary) {
    return (
      <div className="step-container h-full min-h-0">
        <div className="step-header-wrapper">
          <div className="step-header-content">
            <div className="step-header-icon-wrapper">
              <FaLocationDot className="step-header-icon" />
            </div>
            <div>
              <h3 className="step-header-title">Property Location</h3>
              <p className="step-header-description">
                Pinpoint your property location within {userCity.name}
              </p>
            </div>
          </div>
        </div>

        <div className="px-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3">
              <span>Failed to load city boundary. Please try again.</span>
              <button
                type="button"
                onClick={() => {
                  boundaryErrorRef.current = null;
                  actions.refetchBoundary();
                }}
                className="text-sm underline hover:no-underline self-start"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    // make the step a flex column so header stays at the top and the map
    // can expand to fill remaining space in its parent
    <div ref={containerRef} className="step-container h-full min-h-0">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <FaLocationDot className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Property Location</h3>
            <p className="step-header-description">
              Pinpoint your property location within {userCity.name}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Error Alert (boundary/outside errors) */}
      {state.error &&
        (state.error.includes('boundary') ||
          state.error.includes('outside') ||
          state.error.includes('within the city')) && (
          <Alert variant="destructive" className="mx-2">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

      {/* Map (with overlayed search at the top) - allow map to grow */}
      <div className="px-2 h-full flex-1 min-h-0">
        <div className="relative h-full min-h-0">
          {/* Overlayed Search (top of map) */}
          <div className="absolute top-3 left-2 right-2 z-20">
            <div className="md:w-[80%] mx-auto bg-white/90 rounded-md shadow-sm">
              <LocationSearch
                cityName={userCity.name}
                onSelect={handleSearchSelect}
                placeholder={`Search address in ${userCity.name}...`}
              />
            </div>
          </div>

          {/** Stable onMapClick to avoid re-creating handler on every render */}
          {/** clearMapValidationError and handleMapClick are used inside; memoize with useCallback */}
          <LocationMapViewer
            key={mapKey}
            boundary={state.boundary}
            selectedLocation={state.selectedLocation}
            pendingLocation={state.pendingLocation}
            address={state.address}
            isMapPending={state.isMapPending}
            showValidationError={!!mapValidationError}
            validationMessage={mapValidationError ?? null}
            onMapClick={React.useCallback(
              (lat: number, lng: number) => {
                if (clearMapValidationError) {
                  clearMapValidationError();
                }
                void handleMapClick(lat, lng);
              },
              [clearMapValidationError, handleMapClick]
            )}
            isLoading={state.isLoadingBoundary}
            markerRadius={300}
          />
        </div>
      </div>

      {/* Location Details - Hidden but tied to form */}
      <div className="space-y-2 px-2">
        {/* Hidden coordinate fields for form submission */}
        <Controller
          control={control}
          name="lat"
          render={({ field }) => <input {...field} type="hidden" value={field.value ?? ''} />}
        />
        <Controller
          control={control}
          name="lng"
          render={({ field }) => <input {...field} type="hidden" value={field.value ?? ''} />}
        />
      </div>
    </div>
  );
}

/**
 * Memoized version of Step 6 component to prevent unnecessary re-renders
 */
const HousingDialogStep6 = React.memo(HousingDialogStep6Component);

export default HousingDialogStep6;
