'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SelectableList } from '@/components/ui/selectable-list';
import { Counter } from '@/components/ui/shadcn-io/counter';
import { Textarea } from '@/components/ui/textarea';
import { GenderPreference } from '@/generated/prisma';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import React from 'react';
import type { Control } from 'react-hook-form';
import { FaPeopleRoof } from 'react-icons/fa6';

/**
 * Props for the Housing Dialog Step 5 component
 */
export interface HousingDialogStep5Props {
  /** React Hook Form control object for field registration */
  control: Control<HousingFormValues>;
  /** Function to revalidate a specific form field */
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
}

/**
 * Step 5: Household Information
 *
 * Features:
 * - Household size with counter (optional, min: 1, max: 8)
 * - Household gender selection (optional)
 * - Gender preference selection (required - any/female only/male only)
 * - Household description textarea (optional, max 1000 chars)
 *
 * This step helps match renters with compatible living situations.
 * Only genderPreference is required; other fields are optional.
 */
function HousingDialogStep5Component({ control, revalidateField }: HousingDialogStep5Props) {
  return (
    <div className="step-container">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <FaPeopleRoof className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Household Information</h3>
            <p className="step-header-description">
              Share details about your household and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {/* Household Size */}
      <FormField
        control={control}
        name="householdSize"
        render={({ field, fieldState }) => (
          <FormItem className="flex items-baseline justify-between border rounded-4xl p-3">
            <FormLabel className="pl-4">Household size (in total) </FormLabel>
            <FormControl>
              <div className="flex flex-col w-max space-y-1">
                <Counter
                  className="ml-auto"
                  number={typeof field.value === 'number' ? field.value : 0}
                  setNumber={(n) => {
                    // Allow 0 (not set) or min 1, max 8
                    const value = Number(n);
                    const clamped = value === 0 ? 0 : Math.max(1, Math.min(8, value));
                    field.onChange(clamped === 0 ? null : clamped);
                    void revalidateField('householdSize');
                  }}
                  error={!!fieldState.error}
                />
                <FormMessage />
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Household Gender */}
      {/* <FormField
        control={control}
        name="householdGender"
        render={({ field, fieldState }) => (
          <FormItem className="flex flex-col border rounded-4xl p-3">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
              <FormLabel className="pl-4">
                Household gender{' '}
                <span className="text-xs font-light text-neutral-400">Optional</span>
              </FormLabel>
              <FormControl>
                <SelectableList
                  className="w-full md:w-auto"
                  ariaLabel="Household gender"
                  value={field.value ?? null}
                  onChange={(v) => {
                    field.onChange(v);
                    void revalidateField('householdGender');
                  }}
                  options={[
                    { value: HouseholdGender.MIXED, label: 'Mixed' },
                    { value: HouseholdGender.FEMALE_ONLY, label: 'Female only' },
                    { value: HouseholdGender.MALE_ONLY, label: 'Male only' },
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
      /> */}

      {/* Gender Preference - Required */}
      <FormField
        control={control}
        name="genderPreference"
        render={({ field, fieldState }) => (
          <FormItem className="flex flex-col w-full border rounded-4xl p-3">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
              <FormLabel className="pl-4">Looking for</FormLabel>
              <FormControl>
                <SelectableList
                  className="w-full md:w-auto"
                  ariaLabel="Gender preference"
                  value={field.value ?? null}
                  onChange={(v) => {
                    field.onChange(v);
                    void revalidateField('genderPreference');
                  }}
                  options={[
                    { value: GenderPreference.ANY, label: 'Any' },
                    { value: GenderPreference.FEMALE_ONLY, label: 'Female only' },
                    { value: GenderPreference.MALE_ONLY, label: 'Male only' },
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

      {/* Household Description */}
      <div className="flex flex-col">
        <FormField
          control={control}
          name="householdDescription"
          render={({ field, fieldState }) => (
            <FormItem className="flex flex-col rounded-4xl p-3">
              <FormLabel className="pl-2">
                Additional notes{' '}
                <span className="text-xs font-light text-neutral-400">Optional</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  className="shadow-none"
                  rows={3}
                  placeholder="Any additional notes about your preferences..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

/**
 * Memoized version of Step 5 component to prevent unnecessary re-renders
 */
const HousingDialogStep5 = React.memo(HousingDialogStep5Component);

export default HousingDialogStep5;
