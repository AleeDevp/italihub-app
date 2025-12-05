'use client';

import { Calendar } from '@/components/ui/calendar';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SelectableList } from '@/components/ui/selectable-list';
import { Separator } from '@/components/ui/separator';
import { HousingContractType, HousingRentalKind } from '@/generated/prisma';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import { cn } from '@/lib/utils';
import { CalendarDays, Check, X } from 'lucide-react';
import React, { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import type { Control, UseFormReturn } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { FaCalendar } from 'react-icons/fa6';

/**
 * Props for the Housing Dialog Step 2 component
 */
export interface HousingDialogStep2Props {
  /** React Hook Form control object for field registration */
  control: Control<HousingFormValues>;
  /** Function to revalidate a specific form field */
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
  /** React Hook Form instance for full form access */
  form: UseFormReturn<HousingFormValues>;
}

/**
 * Date helper functions
 */
const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const addMonths = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
};

const isSameDay = (a?: Date | null, b?: Date | null): boolean => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const formatDDMMYY = (d: Date | null | undefined): string => {
  if (!d) return 'dd/mm/yy';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

/**
 * Step 2: Availability Period and Contract Details
 *
 * Features:
 * - Contract type selection (PERMANENT only)
 * - Residenza availability (PERMANENT only)
 * - Interactive calendar (single or range mode based on rental kind)
 * - Auto-validation for date dependencies
 * - Conditional field display based on rental kind
 *
 * Validation rules:
 * - TEMPORARY: requires both start and end dates (range selection)
 * - PERMANENT: requires only start date + contract type + residenza
 */
function HousingDialogStep2Component({ control, revalidateField, form }: HousingDialogStep2Props) {
  // Watch rental kind to determine which fields to show
  const rentalKind = useWatch({ control, name: 'rentalKind' });
  const availabilityStartDate = useWatch({ control, name: 'availabilityStartDate' });
  const availabilityEndDate = useWatch({ control, name: 'availabilityEndDate' });

  // Determine rental mode
  const isTemporary = rentalKind === HousingRentalKind.TEMPORARY;

  // Memoized calendar configuration
  const calendarConfig = useMemo(() => {
    const today0 = startOfDay(new Date());
    const MIN_LEAD_DAYS = 2;
    const NAV_MONTHS_AHEAD = 3;
    const minDate = addDays(today0, MIN_LEAD_DAYS);

    const maxDate = isTemporary
      ? availabilityStartDate
        ? addMonths(startOfDay(availabilityStartDate as Date), NAV_MONTHS_AHEAD)
        : addMonths(minDate, NAV_MONTHS_AHEAD)
      : addMonths(today0, NAV_MONTHS_AHEAD);

    const defaultMonth = availabilityStartDate ? (availabilityStartDate as Date) : minDate;

    return { minDate, maxDate, defaultMonth };
  }, [isTemporary, availabilityStartDate]);

  return (
    <div className="step-container">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <FaCalendar className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Availability Period</h3>
            <p className="step-header-description">Set when your property is available for rent</p>
          </div>
        </div>
      </div>

      {/* Contract Type and Residenza - Only for PERMANENT rentals */}
      {rentalKind === HousingRentalKind.PERMANENT && (
        <div className="grid grid-col-1 items-center space-y-4">
          {/* Contract Type Selection */}
          <div className="form-content-card space-y-2">
            <div className="flex justify-between items-center">
              <FormLabel>Contract</FormLabel>
              <FormField
                control={control}
                name="contractType"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <SelectableList
                      className="ml-auto"
                      ariaLabel="Contract type"
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        void revalidateField('contractType');
                      }}
                      options={[
                        { value: HousingContractType.LONG_TERM, label: 'Long term' },
                        { value: HousingContractType.SHORT_TERM, label: 'Short term' },
                        {
                          value: HousingContractType.NONE,
                          label: (
                            <span>
                              <X size={20} className="text-destructive" />
                              <span className="sr-only">No</span>
                            </span>
                          ),
                        },
                      ]}
                      orientation="horizontal"
                      showIndicator={false}
                      error={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Residenza Availability */}
          <div className="form-content-card space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>Residenza available</FormLabel>
              <FormField
                control={control}
                name="residenzaAvailable"
                render={({ field, fieldState }) => (
                  <FormItem className="">
                    <SelectableList
                      className="w-[150px] ml-auto"
                      itemClassName="justify-center"
                      ariaLabel="Residenza availability"
                      value={field.value ?? null}
                      onChange={(v) => {
                        field.onChange(v);
                        void revalidateField('residenzaAvailable');
                      }}
                      showIndicator={false}
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
                      error={!!fieldState.error}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Availability Calendar */}
      <div>
        <Controller
          control={control}
          name="availabilityStartDate"
          render={() => {
            const fromDate = availabilityStartDate as Date | null | undefined;
            const toDate = availabilityEndDate as Date | null | undefined;

            return (
              <FormItem className="form-content-card space-y-2">
                <div className="space-y-1">
                  <FormLabel>Availability</FormLabel>
                  {/* Mode guidance text */}
                  <p className="text-xs text-muted-foreground">
                    {isTemporary ? 'Select the Start date and End date.' : 'Select the Start date.'}
                  </p>
                </div>

                <div className="w-full mx-auto flex flex-col md:flex-row md:justify-between max-w-[320px] md:max-w-none gap-2 md:gap-6">
                  {/* Date Selection Summary */}
                  <div className="w-full md:mt-5 mx-auto space-y-4">
                    <div className="rounded-4xl border py-2 px-6">
                      {/* Start Date Display */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full inset-shadow-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CalendarDays size={14} />
                          </div>
                          <div className="text-sm">
                            <h2 className="text-xs text-neutral-500">Start</h2>
                            {!availabilityStartDate ? (
                              <div className="text-emerald-600">select start date</div>
                            ) : (
                              <div className="tracking-widest">{formatDDMMYY(fromDate)}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="flex w-full gap-4 items-center">
                        <div className="w-full">
                          <Separator />
                        </div>
                        <div className="text-xs text-neutral-400">
                          {isTemporary ? 'Range' : 'Single'}
                        </div>
                      </div>

                      {/* End Date Display */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              isTemporary
                                ? 'bg-red-50 text-red-500 inset-shadow-sm'
                                : 'bg-neutral-100 text-neutral-300'
                            )}
                          >
                            <CalendarDays size={14} />
                          </div>
                          <div className="text-sm">
                            <h2 className="text-xs text-neutral-500">End</h2>
                            {isTemporary ? (
                              !availabilityEndDate ? (
                                availabilityStartDate ? (
                                  <div className="text-red-500">select end date</div>
                                ) : (
                                  '-'
                                )
                              ) : (
                                <div className="tracking-widest">{formatDDMMYY(toDate)}</div>
                              )
                            ) : (
                              <span className="text-sm text-neutral-300">Not required</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Component */}
                  <div
                    className={cn(
                      'border bg-card shadow-xs rounded-4xl md:w-full md:max-w-[320px]',
                      // when either start or end has an error, show the destructive ring like SelectableList
                      (form.getFieldState('availabilityStartDate').error ||
                        form.getFieldState('availabilityEndDate').error) &&
                        'ring-[3px] ring-destructive/20 border-destructive'
                    )}
                    aria-invalid={
                      !!(
                        form.getFieldState('availabilityStartDate').error ||
                        form.getFieldState('availabilityEndDate').error
                      ) || undefined
                    }
                  >
                    {isTemporary ? (
                      <Calendar
                        className="mx-auto"
                        mode="range"
                        selected={
                          {
                            from: fromDate ?? undefined,
                            to: toDate ?? undefined,
                          } as DateRange | undefined
                        }
                        defaultMonth={calendarConfig.defaultMonth}
                        fromDate={calendarConfig.minDate}
                        toDate={calendarConfig.maxDate}
                        onSelect={(range?: DateRange) => {
                          const from = range?.from ?? null;
                          const endCandidate = range?.to ?? null;
                          const to =
                            from && endCandidate && isSameDay(endCandidate, from)
                              ? null
                              : endCandidate;

                          if (from) {
                            form.setValue('availabilityStartDate', from, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                          form.setValue('availabilityEndDate', to, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        required
                        disabled={(date) => {
                          const day = startOfDay(date);
                          return day < calendarConfig.minDate || day > calendarConfig.maxDate;
                        }}
                      />
                    ) : (
                      <Calendar
                        className="mx-auto"
                        mode="single"
                        selected={fromDate ?? undefined}
                        defaultMonth={calendarConfig.defaultMonth}
                        fromDate={calendarConfig.minDate}
                        toDate={calendarConfig.maxDate}
                        onSelect={(d?: Date) => {
                          if (!d) return;
                          form.setValue('availabilityStartDate', d, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          form.setValue('availabilityEndDate', null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={(date) => {
                          const day = startOfDay(date);
                          return day < calendarConfig.minDate || day > calendarConfig.maxDate;
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Error Messages */}
                <div className="space-y-1 ml-auto mx-4">
                  {/* Start Date Error */}
                  <FormField
                    control={control}
                    name="availabilityStartDate"
                    render={({ fieldState }) => (
                      <FormItem>
                        <FormMessage>{fieldState.error?.message}</FormMessage>
                      </FormItem>
                    )}
                  />

                  {/* End Date Error - Only for TEMPORARY */}
                  {isTemporary && (
                    <FormField
                      control={control}
                      name="availabilityEndDate"
                      render={({ fieldState }) => (
                        <FormItem>
                          <FormMessage>{fieldState.error?.message}</FormMessage>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}

/**
 * Memoized version of Step 2 component to prevent unnecessary re-renders
 */
const HousingDialogStep2 = React.memo(HousingDialogStep2Component);

export default HousingDialogStep2;
