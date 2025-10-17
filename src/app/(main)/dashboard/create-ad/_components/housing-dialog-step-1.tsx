'use client';

import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SelectableList } from '@/components/ui/selectable-list';
import {
  HousingPropertyType,
  HousingRentalKind,
  HousingRoomType,
  HousingUnitType,
} from '@/generated/prisma';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import { cn } from '@/lib/utils';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

type Props = {
  control: Control<HousingFormValues>; // use the parent's control type
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
};

export function HousingDialogStep1({ control, revalidateField }: Props) {
  // Centralized dependency: compute enabled state from actual current values
  const unitTypeVal = useWatch({ control, name: 'unitType' });
  const roomEnabled = unitTypeVal === HousingUnitType.ROOM || unitTypeVal === HousingUnitType.BED;
  return (
    <div className="space-y-3">
      <div className="form-content-card">
        <FormField
          control={control}
          name="rentalKind"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Rental kind</FormLabel>
              <SelectableList
                orientation="horizontal"
                className="mt-2"
                ariaLabel="Rental kind"
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  revalidateField('rentalKind');
                }}
                options={[
                  { value: HousingRentalKind.TEMPORARY, label: 'Temporary' },
                  { value: HousingRentalKind.PERMANENT, label: 'Permanent' },
                ]}
                error={!!fieldState.error}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="form-content-card">
        {/* Property type (always visible and required) */}
        <FormField
          control={control}
          name="propertyType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Property type</FormLabel>
              <SelectableList
                className="mt-2"
                ariaLabel="Property type"
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  revalidateField('propertyType');
                }}
                options={[
                  { value: HousingPropertyType.STUDIO, label: 'Studio' },
                  { value: HousingPropertyType.BILOCALE, label: 'Bilocale' },
                  { value: HousingPropertyType.TRILOCALE, label: 'Trilocale' },
                  { value: HousingPropertyType.QUADRILOCALE, label: 'Quadrilocale' },
                  { value: HousingPropertyType.OTHER, label: 'Other' },
                ]}
                error={!!fieldState.error}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Unit type and Room type stacked */}
      <div className="form-content-card">
        <FormField
          control={control}
          name="unitType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Unit type</FormLabel>
              <SelectableList
                className="mt-2"
                ariaLabel="Unit type"
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  revalidateField('unitType');
                }}
                options={[
                  { value: HousingUnitType.WHOLE_APARTMENT, label: 'Whole apartment' },
                  { value: HousingUnitType.ROOM, label: 'Room' },
                  { value: HousingUnitType.BED, label: 'Bed' },
                ]}
                error={!!fieldState.error}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Room type depends on Unit type = ROOM or BED (centralized rule) */}
      <div className={cn(!roomEnabled ? 'form-content-card-disabled' : 'form-content-card')}>
        <FormField
          control={control}
          name="roomType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className={cn({ 'text-muted': !roomEnabled })}>Room type</FormLabel>
              <SelectableList
                className="mt-2"
                ariaLabel="Room type"
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  revalidateField('roomType');
                }}
                options={[
                  { value: HousingRoomType.SINGLE, label: 'Single' },
                  { value: HousingRoomType.DOUBLE, label: 'Double' },
                  { value: HousingRoomType.TRIPLE, label: 'Triple' },
                ]}
                disabled={!roomEnabled}
                error={!!fieldState.error}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default HousingDialogStep1;
