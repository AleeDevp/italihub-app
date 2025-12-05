'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import SelectableChip from '@/components/ui/selectable-chip';
import { SelectableList } from '@/components/ui/selectable-list';
import { Counter } from '@/components/ui/shadcn-io/counter';
import {
  BathroomsIcon,
  COMFORT_AMENITIES_CHIPS,
  CORE_FEATURES_CHIPS,
  FloorIcon,
  HeatingIcon,
} from '@/constants/housing-features-config';
import { HeatingType } from '@/generated/prisma';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import React from 'react';
import type { Control } from 'react-hook-form';
import { IoSparkles } from 'react-icons/io5';

/**
 * Props for the Housing Dialog Step 4 component
 */
export interface HousingDialogStep4Props {
  /** React Hook Form control object for field registration */
  control: Control<HousingFormValues>;
  /** Function to revalidate a specific form field */
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
}

/**
 * Step 4: Property Features
 *
 * Features:
 * - Core attributes (furnished, kitchen equipped, private bathroom, balcony, elevator, newly renovated)
 * - Floor number with counter (range: -2 to 20)
 * - Number of bathrooms with counter (range: 1 to 4)
 * - Heating type selection (central, independent, unknown)
 * - Comfort & convenience amenities (wifi, AC, dishwasher, washing machine, dryer, double glazed windows)
 *
 * All features are optional and use boolean toggles via SelectableChip components.
 * Floor number and bathroom count use Counter components with validation.
 */
function HousingDialogStep4Component({ control, revalidateField }: HousingDialogStep4Props) {
  return (
    <div className="step-container">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <IoSparkles className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Property Features</h3>
            <p className="step-header-description">Highlight amenities and special features</p>
          </div>
        </div>
      </div>

      {/* Essential features */}
      <div className="form-content-card space-y-2">
        <div className="flex mb-4 mx-2">
          <div className="font-medium">🏠 Core attributes</div>
        </div>

        {/* Core Features - Chip Selection */}
        <div className="flex flex-wrap gap-2 border rounded-4xl p-4">
          {CORE_FEATURES_CHIPS.map((chip) => (
            <FormField
              key={chip.fieldName}
              control={control}
              name={chip.fieldName}
              render={({ field }) => (
                <SelectableChip
                  selected={!!field.value}
                  onSelect={(s) => field.onChange(Boolean(s))}
                  icon={chip.icon}
                  label={chip.label}
                />
              )}
            />
          ))}
        </div>

        {/* Floor, Bathrooms, and Heating - Counter & Selection */}
        <div className="flex flex-col space-y-2">
          {/* Floor Number */}
          <FormField
            control={control}
            name="floorNumber"
            render={({ field, fieldState }) => (
              <FormItem className="flex items-baseline justify-between border rounded-4xl p-3">
                <span className="flex items-center gap-2 pl-4">
                  <FloorIcon />
                  <FormLabel>Floor</FormLabel>
                </span>
                <FormControl>
                  <div className="w-max">
                    <Counter
                      number={typeof field.value === 'number' ? field.value : 0}
                      setNumber={(n) => {
                        // Clamp to -2..20 (basement to penthouse)
                        const clamped = Math.max(-2, Math.min(15, Number(n)));
                        field.onChange(Number(clamped));
                        void revalidateField('floorNumber');
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Number of Bathrooms */}
          <FormField
            control={control}
            name="numberOfBathrooms"
            render={({ field, fieldState }) => (
              <FormItem className="flex items-baseline justify-between border rounded-4xl p-3">
                <span className="flex items-center gap-2 pl-4">
                  <BathroomsIcon />
                  <FormLabel>Number of bathrooms</FormLabel>
                </span>
                <FormControl>
                  <div className="w-max">
                    <Counter
                      number={typeof field.value === 'number' ? field.value : 1}
                      setNumber={(n) => {
                        // Clamp to 1..4
                        const clamped = Math.max(1, Math.min(4, Number(n)));
                        field.onChange(Number(clamped));
                        void revalidateField('numberOfBathrooms');
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Heating Type */}
          <FormField
            control={control}
            name="heatingType"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col border rounded-4xl p-3">
                <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
                  <span className="flex items-center gap-2 pl-4">
                    <HeatingIcon />
                    <FormLabel>Heating</FormLabel>
                  </span>
                  <FormControl>
                    <SelectableList
                      className="w-full md:w-auto"
                      ariaLabel="Heating type"
                      value={field.value ?? null}
                      onChange={(v) => {
                        field.onChange(v);
                        void revalidateField('heatingType');
                      }}
                      options={[
                        { value: HeatingType.CENTRAL, label: 'Central' },
                        { value: HeatingType.INDEPENDENT, label: 'Independent' },
                        { value: HeatingType.UNKNOWN, label: 'Unknown' },
                      ]}
                      orientation="horizontal"
                      showIndicator={false}
                      error={!!fieldState.error}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Comfort & Convenience */}
      <div className="form-content-card space-y-2">
        <div className="flex flex-col mb-4 mx-2">
          <div className="font-medium">🔌 Comfort & convenience</div>
        </div>

        <div className="flex flex-wrap gap-2 border rounded-4xl p-4">
          {COMFORT_AMENITIES_CHIPS.map((chip) => (
            <FormField
              key={chip.fieldName}
              control={control}
              name={chip.fieldName}
              render={({ field }) => (
                <SelectableChip
                  selected={!!field.value}
                  onSelect={(s) => field.onChange(Boolean(s))}
                  icon={chip.icon}
                  label={chip.label}
                />
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized version of Step 4 component to prevent unnecessary re-renders
 */
const HousingDialogStep4 = React.memo(HousingDialogStep4Component);

export default HousingDialogStep4;
