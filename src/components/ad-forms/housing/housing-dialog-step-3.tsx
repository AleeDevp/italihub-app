'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SelectableList } from '@/components/ui/selectable-list';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { BillsPolicy, HousingRentalKind } from '@/generated/prisma';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import React from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { FaEuroSign } from 'react-icons/fa';

/**
 * Props for the Housing Dialog Step 3 component
 */
export interface HousingDialogStep3Props {
  /** React Hook Form control object for field registration */
  control: Control<HousingFormValues>;
  /** Function to revalidate a specific form field */
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
  /** React Hook Form instance for full form access */
  form: UseFormReturn<HousingFormValues>;
}

/**
 * Step 3: Pricing Details
 *
 * Features:
 * - Price amount with negotiable toggle
 * - Deposit amount (PERMANENT only)
 * - Agency fee selection and amount (PERMANENT only)
 * - Bills policy selection (PERMANENT only)
 * - Bills monthly estimate (PERMANENT only, conditional)
 * - Bills notes (PERMANENT only, optional)
 *
 * Validation rules:
 * - TEMPORARY: Only requires price (daily rate)
 * - PERMANENT: Requires price (monthly), bills policy, agency fee selection
 * - Price required unless negotiable
 * - Agency fee amount required if hasAgencyFee is true
 * - Bills estimate shown only for EXCLUDED/PARTIAL policies
 */
function HousingDialogStep3Component({ control, revalidateField, form }: HousingDialogStep3Props) {
  // Watch rental kind and pricing-related fields
  const rentalKind = useWatch({ control, name: 'rentalKind' });
  const priceNegotiable = useWatch({ control, name: 'priceNegotiable' });
  const hasAgencyFee = useWatch({ control, name: 'hasAgencyFee' });
  const billsPolicy = useWatch({ control, name: 'billsPolicy' });

  // Determine rental mode
  const isTemporary = rentalKind === HousingRentalKind.TEMPORARY;

  return (
    <div className="step-container">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <FaEuroSign className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Pricing Details</h3>
            <p className="step-header-description">Set the rental price and additional costs</p>
          </div>
        </div>
      </div>

      {/* Price and Deposit */}
      <div className="flex flex-col form-content-card">
        {/* Price Amount */}
        <FormField
          control={control}
          name="priceAmount"
          render={({ field, fieldState }) => (
            <FormItem>
              <div className="flex items-baseline gap-2">
                <FormLabel>Price</FormLabel>
                <Badge>{form.getValues('priceType')?.toLowerCase() ?? 'price'}</Badge>
              </div>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">€</span>
                  <Input
                    className="pl-8"
                    type="number"
                    inputMode="decimal"
                    disabled={priceNegotiable}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      field.onChange(e.target.value === '' ? null : Number(e.target.value));
                      void revalidateField('priceAmount');
                    }}
                    placeholder="Enter amount"
                    aria-invalid={!!fieldState.error}
                  />
                </div>
              </FormControl>

              {/* Price Negotiable Checkbox */}
              <FormField
                control={control}
                name="priceNegotiable"
                render={({ field: negotiableField }) => (
                  <FormItem className="flex flex-row items-center justify-end gap-2 mt-2">
                    <FormControl>
                      <Checkbox
                        checked={!!negotiableField.value}
                        onCheckedChange={(v) => {
                          negotiableField.onChange(Boolean(v));
                          // Clear priceAmount error when negotiable is checked
                          if (v) {
                            form.clearErrors('priceAmount');
                          } else {
                            // Revalidate when unchecked to show error if needed
                            void revalidateField('priceAmount');
                          }
                        }}
                      />
                    </FormControl>
                    <div className="text-sm">Negotiable</div>
                  </FormItem>
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Separator for PERMANENT rentals */}
        {!isTemporary && <Separator className="my-5" />}

        {/* Deposit Amount - PERMANENT only */}
        {!isTemporary && (
          <FormField
            control={control}
            name="depositAmount"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-2">
                <FormLabel className={cn({ 'text-muted': isTemporary })}>
                  Deposit <span className="text-xs font-light text-neutral-400">Optional</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">€</span>
                    <Input
                      className="pl-8"
                      type="number"
                      inputMode="decimal"
                      disabled={isTemporary}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        field.onChange(e.target.value === '' ? null : Number(e.target.value));
                        void revalidateField('depositAmount');
                      }}
                      placeholder={isTemporary ? 'N/A' : 'Enter amount'}
                      aria-invalid={!!fieldState.error}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Agency Fee - PERMANENT only */}
      {!isTemporary && (
        <div className="flex flex-col form-content-card">
          <FormField
            control={control}
            name="agencyFeeAmount"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="flex-2">Property has agency fee</FormLabel>
                  <FormField
                    control={control}
                    name="hasAgencyFee"
                    render={({ field: agencyFeeField, fieldState: agencyFeeFieldState }) => (
                      <SelectableList
                        className="flex-1 w-full"
                        itemClassName="justify-center"
                        ariaLabel="Property has agency fee"
                        value={agencyFeeField.value ?? null}
                        onChange={(v) => {
                          agencyFeeField.onChange(v);
                          void revalidateField('hasAgencyFee');
                          // If user explicitly selects "No" for agency fee, clear the amount and its errors
                          if (v === false) {
                            form.setValue('agencyFeeAmount', null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            form.clearErrors('agencyFeeAmount');
                          }
                        }}
                        showIndicator={false}
                        disabled={isTemporary}
                        options={[
                          {
                            value: true,
                            label: (
                              <span>
                                <Check size={20} className="text-emerald-600" />
                                <span className="sr-only">Yes</span>
                              </span>
                            ),
                          },
                          {
                            value: false,
                            label: (
                              <span>
                                <X size={20} className="text-destructive" />
                                <span className="sr-only">No</span>
                              </span>
                            ),
                          },
                        ]}
                        orientation="horizontal"
                        error={!!agencyFeeFieldState.error}
                      />
                    )}
                  />
                </div>

                {/* Agency Fee Amount Input - shown only if hasAgencyFee is true */}
                <FormControl>
                  {form.getValues('hasAgencyFee') && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">€</span>
                      <Input
                        className="pl-8"
                        type="number"
                        inputMode="decimal"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isTemporary || !hasAgencyFee}
                        onChange={(e) => {
                          field.onChange(e.target.value === '' ? null : Number(e.target.value));
                          void revalidateField('agencyFeeAmount');
                        }}
                        placeholder={
                          isTemporary ? 'N/A' : hasAgencyFee ? 'Enter amount' : 'No agency fee'
                        }
                        aria-invalid={!!fieldState.error}
                      />
                    </div>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Bills - PERMANENT only */}
      {!isTemporary && (
        <div className="flex flex-col form-content-card">
          <FormField
            control={control}
            name="billsMonthlyEstimate"
            render={({ field, fieldState }) => (
              <FormItem>
                {/* Bills Policy Selection */}
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-3">
                  <FormLabel className={cn('flex-1', { 'text-muted': isTemporary })}>
                    Bills
                  </FormLabel>
                  <FormField
                    control={control}
                    name="billsPolicy"
                    render={({ field: billsPolicyField, fieldState: billsPolicyFieldState }) => (
                      <SelectableList
                        className="md:flex-2 w-full"
                        itemClassName="justify-center"
                        ariaLabel="Bills policy selection"
                        value={billsPolicyField.value ?? null}
                        onChange={(v) => {
                          if (v === BillsPolicy.INCLUDED) {
                            form.setValue('billsMonthlyEstimate', null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            form.clearErrors('billsMonthlyEstimate');
                          }
                          billsPolicyField.onChange(v);
                          void revalidateField('billsPolicy');
                        }}
                        showIndicator={false}
                        disabled={isTemporary}
                        options={[
                          { value: BillsPolicy.INCLUDED, label: 'Included' },
                          { value: BillsPolicy.EXCLUDED, label: 'Excluded' },
                          { value: BillsPolicy.PARTIAL, label: 'Partial' },
                        ]}
                        orientation="horizontal"
                        error={!!billsPolicyFieldState.error}
                      />
                    )}
                  />
                </div>

                {/* Bills Monthly Estimate - shown only for EXCLUDED/PARTIAL */}
                <FormControl>
                  {(form.getValues('billsPolicy') === BillsPolicy.EXCLUDED ||
                    form.getValues('billsPolicy') === BillsPolicy.PARTIAL) && (
                    <FormItem className="mt-4">
                      <FormLabel className="pl-2">
                        Monthly Estimate{' '}
                        <span className="text-xs font-light text-neutral-400">Optional</span>
                      </FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">€</span>
                        <Input
                          className="pl-8"
                          type="number"
                          inputMode="decimal"
                          disabled={
                            isTemporary ||
                            !(
                              billsPolicy === BillsPolicy.EXCLUDED ||
                              billsPolicy === BillsPolicy.PARTIAL
                            )
                          }
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            field.onChange(e.target.value === '' ? null : Number(e.target.value));
                            void revalidateField('billsMonthlyEstimate');
                          }}
                          placeholder={
                            isTemporary
                              ? 'N/A'
                              : billsPolicy === BillsPolicy.EXCLUDED ||
                                  billsPolicy === BillsPolicy.PARTIAL
                                ? 'Enter estimate'
                                : 'Bills included'
                          }
                          aria-invalid={!!fieldState.error}
                        />
                      </div>
                    </FormItem>
                  )}
                </FormControl>
                <FormMessage />

                {/* Bills Notes - Optional */}
                <div className="mt-3">
                  <FormField
                    control={control}
                    name="billsNotes"
                    render={({ field: notesField }) => (
                      <FormItem className="mt-3">
                        <FormLabel className="pl-2">
                          Bill additional notes{' '}
                          <span className="text-xs font-light text-neutral-400">Optional</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Any additional notes about bills"
                            {...notesField}
                            value={notesField.value ?? ''}
                            disabled={isTemporary}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Memoized version of Step 3 component to prevent unnecessary re-renders
 */
const HousingDialogStep3 = React.memo(HousingDialogStep3Component);

export default HousingDialogStep3;
