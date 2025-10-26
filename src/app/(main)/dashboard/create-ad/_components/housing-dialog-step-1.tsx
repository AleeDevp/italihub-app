'use client';

import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SelectableList } from '@/components/ui/selectable-list';
import { HousingPropertyType, HousingRentalKind, HousingUnitType } from '@/generated/prisma';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

type Props = {
  control: Control<HousingFormValues>; // use the parent's control type
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
};

export function HousingDialogStep1({ control, revalidateField }: Props) {
  // Centralized dependency: compute enabled state from actual current values
  const propertyTypeVal = useWatch({ control, name: 'propertyType' });

  // If property is STUDIO, only whole apartment is allowed
  const isStudio = propertyTypeVal === HousingPropertyType.STUDIO;

  return (
    <div className="space-y-2">
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
                  // Prevent changing to room/bed when property is studio
                  if (isStudio && val !== HousingUnitType.WHOLE_APARTMENT) return;
                  field.onChange(val);
                  revalidateField('unitType');
                }}
                options={[
                  { value: HousingUnitType.WHOLE_APARTMENT, label: 'Whole apartment' },
                  { value: HousingUnitType.SINGLE_ROOM, label: 'Single room', disabled: isStudio },
                  { value: HousingUnitType.DOUBLE_ROOM, label: 'Double room', disabled: isStudio },
                  { value: HousingUnitType.TRIPLE_ROOM, label: 'Triple room', disabled: isStudio },
                ]}
                error={!!fieldState.error}
              />
              {isStudio && (
                <p className="text-xs text-muted-foreground mt-2">
                  Studios are whole apartments — room/bed options aren't applicable.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* roomType field removed — unitType encodes room sizing */}
    </div>
  );
}

export default HousingDialogStep1;
