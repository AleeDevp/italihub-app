'use client';

import { CalendarDays, Check, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import SelectableChip from '@/components/ui/selectable-chip';
import { SelectableList } from '@/components/ui/selectable-list';
import { Separator } from '@/components/ui/separator';
import { Counter } from '@/components/ui/shadcn-io/counter';
import { Textarea } from '@/components/ui/textarea';
import {
  AdCategory,
  BillsPolicy,
  GenderPreference,
  HeatingType,
  HouseholdGender,
  HousingContractType,
  HousingPriceType,
  HousingRentalKind,
  HousingUnitType,
} from '@/generated/prisma';
import { useConfirmBeforeClose } from '@/hooks/use-confirm-before-close';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  housingSchema,
  pruneHousingValuesForBranch,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  STEP_FIELDS,
  validateStep,
  type HousingFormValues,
} from '@/lib/schemas/ads/housing-schema';
import { cn } from '@/lib/utils';
import HousingDialogStep1 from './housing-dialog-step-1';

// Date helpers (module-level)
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const addMonths = (d: Date, n: number) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
};
const isSameDay = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};
const formatDDMMYY = (d: Date | null | undefined) => {
  if (!d) return 'dd/mm/yy';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

export function HousingCreateDialog() {
  const contentScrollRef = React.useRef<HTMLDivElement | null>(null);
  const { open, onOpenChange, handleCancel, confirmDialog, setIsDirty } = useConfirmBeforeClose({
    onConfirmClose: () => {
      try {
        resetDialogState();
      } catch {}
    },
  });
  const [currentStep, setCurrentStep] = useState<number>(1);
  const isMobile = useIsMobile();

  const form = useForm<HousingFormValues>({
    // Using manual validation due to complex schema transformations
    // Omit defaultValues so all fields start empty and must be provided by the user
    mode: 'onSubmit',
  });

  const { control, handleSubmit } = form;

  // Robust dirty-state: snapshot values on open and compare current values via stable stringify
  const dirtySnapshotRef = useRef<string | null>(null);
  // track dirty state internally only to compare with baseline
  const stableStringify = (value: any): string => {
    const seen = new WeakSet();
    const normalize = (v: any): any => {
      if (v instanceof Date) return v.toISOString();
      if (v === null || typeof v !== 'object') return v;
      if (seen.has(v)) return null;
      seen.add(v);
      if (Array.isArray(v)) return v.map((i) => normalize(i));
      const keys = Object.keys(v).sort();
      const out: Record<string, any> = {};
      for (const k of keys) out[k] = normalize(v[k]);
      return out;
    };
    return JSON.stringify(normalize(value));
  };

  // On dialog open, fully reset form and dirty baseline so it always starts fresh
  useEffect(() => {
    if (open) {
      try {
        resetDialogState();
      } catch {}
    }
  }, [open, form, setIsDirty]);

  // While open, watch all changes and update dirty state by comparing to snapshot
  useEffect(() => {
    if (!open) return;
    const subscription = form.watch(() => {
      const current = stableStringify(form.getValues());
      const dirty = dirtySnapshotRef.current != null && dirtySnapshotRef.current !== current;
      setIsDirty(dirty);
    });
    return () => subscription.unsubscribe();
  }, [open, form, setIsDirty]);

  const onSubmit = (values: HousingFormValues) => {
    try {
      // Validate the form values with the schema
      const validatedValues = housingSchema.parse(values);
      const cleaned = pruneHousingValuesForBranch(validatedValues);
      const uiHasAgencyFee = Boolean(form.getValues('hasAgencyFee'));
      const payload = {
        ad: {
          category: AdCategory.HOUSING,
          expirationDate: cleaned.availabilityStartDate!,
        },
        housing: {
          rentalKind: cleaned.rentalKind,
          unitType: cleaned.unitType,
          propertyType: cleaned.propertyType ?? null,
          roomType:
            cleaned.unitType === HousingUnitType.ROOM || cleaned.unitType === HousingUnitType.BED
              ? (cleaned.roomType ?? null)
              : null,
          availabilityStartDate: cleaned.availabilityStartDate!,
          availabilityEndDate: cleaned.availabilityEndDate ?? null,
          contractType: cleaned.contractType,
          residenzaAvailable: cleaned.residenzaAvailable ?? null,
          priceType: cleaned.priceType,
          priceAmount: cleaned.priceNegotiable ? null : (cleaned.priceAmount ?? null),
          priceNegotiable: cleaned.priceNegotiable,
          depositAmount: cleaned.depositAmount ?? null,
          agencyFeeAmount: uiHasAgencyFee ? (cleaned.agencyFeeAmount ?? null) : null,
          billsPolicy: cleaned.billsPolicy,
          wifi: !!cleaned.wifi,
          washingMachine: !!cleaned.washingMachine,
          dishwasher: !!cleaned.dishwasher,
          balcony: !!cleaned.balcony,
          terrace: !!cleaned.terrace,
          heatingType: cleaned.heatingType,
          doubleGlazedWindows: !!cleaned.doubleGlazedWindows,
          airConditioning: !!cleaned.airConditioning,
          householdSize: cleaned.householdSize,
          householdGender: cleaned.householdGender,
          genderPreference: cleaned.genderPreference,
          householdDescription: cleaned.householdDescription ?? null,
          neighborhood: cleaned.neighborhood ?? null,
          streetHint: cleaned.streetHint ?? null,
          lat: cleaned.lat ?? null,
          lng: cleaned.lng ?? null,
          transitLines: cleaned.transitLines ?? [],
          shopsNearby: cleaned.shopsNearby ?? [],
          notes: cleaned.notes ?? null,
        },
      } as const;

      // eslint-disable-next-line no-console
      console.log('Create Housing Ad payload', payload);
    } catch (error) {
      console.error('Form validation failed:', error);
      // The form should handle validation errors internally
      return;
    }
  };

  // Helper to reset the entire dialog state consistently
  const resetDialogState = React.useCallback(() => {
    // Clear all fields and step when the dialog is (re)opened or confirmed closed
    form.reset();
    setCurrentStep(1);
    // Scroll to top and blur any focused element from previous session
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      try {
        document.activeElement.blur();
      } catch {}
    }
    // Establish a new clean dirty baseline
    dirtySnapshotRef.current = stableStringify(form.getValues());
    setIsDirty(false);
  }, [form, setIsDirty]);

  // Helpers
  const rentalKind = useWatch({ control, name: 'rentalKind' });
  const unitType = useWatch({ control, name: 'unitType' });
  // Keep the parent lightweight; step gating updates via useStepValidity hook below
  const availabilityStartDate = form.watch('availabilityStartDate');
  const availabilityEndDate = form.watch('availabilityEndDate');
  const isRoomy = unitType === HousingUnitType.ROOM || unitType === HousingUnitType.BED;
  const billsPolicy = form.watch('billsPolicy');
  const priceNegotiable = !!form.watch('priceNegotiable');
  const hasAgencyFee = !!form.watch('hasAgencyFee');

  // Determine which fields should be disabled based on rental kind
  const isTemporary = rentalKind === HousingRentalKind.TEMPORARY;
  const isPermanent = rentalKind === HousingRentalKind.PERMANENT;

  // Auto-manage fields when controlling fields change
  useEffect(() => {
    // TEMPORARY rental logic
    if (rentalKind === HousingRentalKind.TEMPORARY) {
      // Auto-set price type to DAILY
      if (form.getValues('priceType') !== HousingPriceType.DAILY) {
        form.setValue('priceType', HousingPriceType.DAILY, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      // Clear contract fields
      if (form.getValues('contractType') != null) {
        form.setValue('contractType', null, { shouldDirty: true, shouldValidate: true });
      }
      if (form.getValues('residenzaAvailable') != null) {
        form.setValue('residenzaAvailable', null, { shouldDirty: true, shouldValidate: true });
      }

      // Clear deposit
      if (form.getValues('depositAmount') != null) {
        form.setValue('depositAmount', null, { shouldDirty: true, shouldValidate: true });
      }

      // Clear agency fee
      if (form.getValues('hasAgencyFee') != null) {
        form.setValue('hasAgencyFee', null, { shouldDirty: true, shouldValidate: true });
      }
      if (form.getValues('agencyFeeAmount') != null) {
        form.setValue('agencyFeeAmount', null, { shouldDirty: true, shouldValidate: true });
      }

      // Clear bills
      if (form.getValues('billsPolicy') != null) {
        form.setValue('billsPolicy', null as any, { shouldDirty: true, shouldValidate: true });
      }
      if (form.getValues('billsMonthlyEstimate') != null) {
        form.setValue('billsMonthlyEstimate', null, { shouldDirty: true, shouldValidate: true });
      }
      if (form.getValues('billsNotes') != null) {
        form.setValue('billsNotes', undefined, { shouldDirty: true, shouldValidate: true });
      }
    }

    // PERMANENT rental logic
    if (rentalKind === HousingRentalKind.PERMANENT) {
      // Auto-set price type to MONTHLY
      if (form.getValues('priceType') !== HousingPriceType.MONTHLY) {
        form.setValue('priceType', HousingPriceType.MONTHLY, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      // Clear end date (not applicable for permanent)
      if (form.getValues('availabilityEndDate')) {
        form.setValue('availabilityEndDate', null, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }

    // unitType toggles roomType
    if (unitType === HousingUnitType.WHOLE_APARTMENT) {
      if (form.getValues('roomType') != null) {
        form.setValue('roomType', null, { shouldDirty: true, shouldValidate: true });
      }
    }

    // priceNegotiable toggles priceAmount
    if (priceNegotiable) {
      if (form.getValues('priceAmount') != null) {
        form.setValue('priceAmount', null, { shouldDirty: true, shouldValidate: true });
      }
    }

    // hasAgencyFee toggles agencyFeeAmount (only for permanent)
    if (isPermanent && !hasAgencyFee) {
      if (form.getValues('agencyFeeAmount') != null) {
        form.setValue('agencyFeeAmount', null, { shouldDirty: true, shouldValidate: true });
      }
    }

    // billsPolicy toggles billsMonthlyEstimate (only for permanent)
    if (isPermanent && billsPolicy === BillsPolicy.INCLUDED) {
      if (form.getValues('billsMonthlyEstimate') != null) {
        form.setValue('billsMonthlyEstimate', null, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  }, [rentalKind, unitType, priceNegotiable, hasAgencyFee, billsPolicy, form]);

  // Step definitions
  const stepDefs = useMemo(
    () => [
      { id: 1, label: 'Basics' },
      { id: 2, label: 'Availability' },
      { id: 3, label: 'Pricing' },
      { id: 4, label: 'Features' },
      { id: 5, label: 'Household' },
      { id: 6, label: 'Location' },
      { id: 7, label: 'Notes' },
      { id: 8, label: 'Review' },
    ],
    []
  );
  const totalSteps = stepDefs.length;

  // Watch fields relevant to current step for validation
  const stepFields = STEP_FIELDS[currentStep] || [];
  useWatch({ control, name: stepFields as any });

  // Validate current step
  const currentStepIsValid = useMemo(() => {
    return validateStep(currentStep, form.getValues());
  }, [currentStep, form.watch()]);

  // Check if user can navigate to a target step
  const canNavigateTo = useCallback(
    (target: number) => {
      if (target <= currentStep) return true;
      // Validate all steps between current and target
      for (let s = 1; s < target; s++) {
        if (!validateStep(s, form.getValues())) return false;
      }
      return true;
    },
    [currentStep, form]
  );

  // Stepper UI constants
  const INDICATOR_DIAMETER = 44;
  const CONNECTOR_LENGTH = 44;
  const LABEL_GAP_PX = 6;
  const LABEL_BLOCK_HEIGHT = 24;
  const SEGMENT_CENTER_GAP = INDICATOR_DIAMETER + CONNECTOR_LENGTH;
  const VISIBLE_STEP_COUNT = isMobile ? 3 : 5;

  // Calculate stepper positioning
  const totalWidth = INDICATOR_DIAMETER * totalSteps + CONNECTOR_LENGTH * (totalSteps - 1);
  const viewportWidth =
    INDICATOR_DIAMETER * VISIBLE_STEP_COUNT + CONNECTOR_LENGTH * (VISIBLE_STEP_COUNT - 1);
  const currentIdx = Math.max(0, Math.min(totalSteps - 1, currentStep - 1));
  const stepCenterX = INDICATOR_DIAMETER / 2 + currentIdx * SEGMENT_CENTER_GAP;
  const halfViewport = viewportWidth / 2;
  const unclampedTranslate = halfViewport - stepCenterX;
  const minTranslate = viewportWidth - totalWidth;
  const maxTranslate = 0;
  const translateX = Math.max(minTranslate, Math.min(maxTranslate, unclampedTranslate));

  // Edge fade mask for overflow
  const MASK_FADE_PX = 28;
  const hasOverflow = totalWidth > viewportWidth;
  const showLeftFade = hasOverflow && currentStep > 1;
  const showRightFade = hasOverflow && currentStep < totalSteps;
  const maskGradient =
    showLeftFade && showRightFade
      ? `linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) ${MASK_FADE_PX}px, rgba(0,0,0,1) calc(100% - ${MASK_FADE_PX}px), rgba(0,0,0,0))`
      : showLeftFade && !showRightFade
        ? `linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) ${MASK_FADE_PX}px, rgba(0,0,0,1))`
        : !showLeftFade && showRightFade
          ? `linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,1) calc(100% - ${MASK_FADE_PX}px), rgba(0,0,0,0))`
          : `linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,1))`;

  const goTo = (s: number) => {
    if (s < 1 || s > totalSteps) return;
    if (!canNavigateTo(s)) return;
    setCurrentStep(s);
    // ensure the scrollable step content is shown from the top when navigating
    try {
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };
  const goPrev = () => goTo(currentStep - 1);

  // Helper to revalidate a specific field when it changes
  const revalidateField = async (fieldName: keyof HousingFormValues) => {
    const stepSchema = getStepSchema(currentStep);
    if (!stepSchema) return;

    const result = await stepSchema.safeParseAsync(form.getValues());

    if (result.success) {
      // Validation passed, clear error for this field
      form.clearErrors(fieldName);
    } else {
      // Check if this specific field has an error
      const zodErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const fieldError = zodErrors[fieldName];

      if (fieldError && fieldError.length > 0) {
        // Field still has error, set it
        form.setError(fieldName, {
          type: 'manual',
          message: fieldError[0],
        });
      } else {
        // Field is now valid, clear its error
        form.clearErrors(fieldName);
      }
    }
  };

  // Modified goNext to trigger validation and show errors
  const goNext = async () => {
    // Trigger validation for current step
    const stepSchema = getStepSchema(currentStep);
    if (!stepSchema) {
      goTo(currentStep + 1);
      return;
    }

    const result = await stepSchema.safeParseAsync(form.getValues());

    if (!result.success) {
      // Validation failed, manually set errors from Zod
      const zodErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const stepFieldsList = STEP_FIELDS[currentStep] || [];

      // Clear all errors for this step first
      stepFieldsList.forEach((fieldName) => {
        form.clearErrors(fieldName as any);
      });

      // Set errors from Zod validation
      Object.entries(zodErrors).forEach(([fieldName, messages]) => {
        if (messages && messages.length > 0) {
          form.setError(fieldName as any, {
            type: 'manual',
            message: messages[0],
          });
        }
      });

      return; // Don't proceed to next step
    }

    // Validation passed, clear errors and move to next step
    const stepFieldsList = STEP_FIELDS[currentStep] || [];
    stepFieldsList.forEach((fieldName) => {
      form.clearErrors(fieldName as any);
    });
    goTo(currentStep + 1);
  };

  // Helper to get step schema
  const getStepSchema = (step: number) => {
    switch (step) {
      case 1:
        return step1Schema;
      case 2:
        return step2Schema;
      case 3:
        return step3Schema;
      case 4:
        return step4Schema;
      case 5:
        return step5Schema;
      case 6:
        return step6Schema;
      case 7:
        return step7Schema;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="ad-housing hover:shadow-lg">
          Start creating housing ad
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-full md:!max-w-3xl h-[95vh] flex flex-col rounded-4xl px-2"
        disableOutsideClose
        disableEscapeClose
        showCloseButton={false}
      >
        <DialogHeader className="px-6 flex flex-col items-center justify-center">
          <DialogTitle>Create housing ad</DialogTitle>
          <DialogDescription>Fill out the details below to publish your listing.</DialogDescription>
        </DialogHeader>

        <div className="relative w-full mb-4">
          <div
            className="mx-auto overflow-hidden"
            style={{
              width: `${viewportWidth}px`,
              WebkitMaskImage: maskGradient,
              maskImage: maskGradient,
            }}
          >
            {/* Row: indicators + connectors (labels inline under buttons) */}
            <div
              className="flex items-center transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0"
              style={{
                transform: `translateX(${translateX}px)`,
                willChange: 'transform',
                paddingBottom: `${LABEL_BLOCK_HEIGHT + LABEL_GAP_PX}px`,
              }}
            >
              {stepDefs.map((step, i) => {
                const idx = i + 1;
                const isCurrent = idx === currentStep;
                const isClickable = !isCurrent && canNavigateTo(idx);
                const indicatorClass = isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-neutral-200 text-muted-foreground';
                const isLast = idx === totalSteps;
                return (
                  <div key={idx} className="relative flex items-center">
                    <div
                      className="relative"
                      style={{
                        width: `${INDICATOR_DIAMETER}px`,
                        height: `${INDICATOR_DIAMETER}px`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => (isClickable ? goTo(idx) : undefined)}
                        className={`rounded-full flex items-center justify-center font-medium outline-none ${indicatorClass} ${
                          isClickable ? 'hover:opacity-90' : 'opacity-100'
                        }`}
                        style={{
                          width: `${INDICATOR_DIAMETER}px`,
                          height: `${INDICATOR_DIAMETER}px`,
                        }}
                        disabled={!isClickable}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {idx}
                      </button>
                      {/* Inline label below the indicator */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 ${
                          isCurrent ? 'text-[11px]' : 'text-[10px] text-muted-foreground'
                        } whitespace-nowrap overflow-hidden text-ellipsis text-center`}
                        style={{
                          top: `${INDICATOR_DIAMETER + LABEL_GAP_PX}px`,
                          maxWidth: `${SEGMENT_CENTER_GAP}px`,
                        }}
                      >
                        {step.label}
                      </div>
                    </div>
                    {!isLast && (
                      <span
                        className="h-1 bg-neutral-200"
                        style={{ width: `${CONNECTOR_LENGTH}px` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
            className="flex flex-1 min-h-0 flex-col justify-between"
          >
            {/* Scrollable step content container (animation-free) */}
            <div
              ref={contentScrollRef}
              className="bg-neutral-50 min-h-[320px] h-full overflow-y-auto py-4 p-2 rounded-3xl inset-shadow-sm border"
            >
              {/* Rental & Unit */}
              {currentStep === 1 && (
                <HousingDialogStep1 control={control} revalidateField={revalidateField} />
              )}

              {/* Availability & Contract */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  {/* Row 2: Contract + Residenza */}
                  <div className="grid grid-col-1 items-center gap-4">
                    <FormField
                      control={control}
                      name="contractType"
                      render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col form-content-card">
                          <div className="flex justify-between items-center">
                            <FormLabel>Contract</FormLabel>
                            <SelectableList
                              className="mt-2"
                              ariaLabel="Contract type"
                              value={field.value}
                              onChange={(v) => {
                                field.onChange(v);
                                revalidateField('contractType');
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
                              disabled={rentalKind !== HousingRentalKind.PERMANENT}
                              error={!!fieldState.error}
                            />
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="residenzaAvailable"
                      render={({ field, fieldState }) => (
                        <FormItem className="form-content-card">
                          <div className="flex items-center justify-between">
                            <FormLabel>Residenza available</FormLabel>
                            <SelectableList
                              className="w-[150px]"
                              itemClassName="justify-center"
                              ariaLabel="Residenza availability"
                              value={field.value ?? null}
                              onChange={(v) => {
                                field.onChange(v);
                                revalidateField('residenzaAvailable');
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
                              disabled={rentalKind !== HousingRentalKind.PERMANENT}
                              error={!!fieldState.error}
                            />
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Availability calendar (single or range) */}
                  <div>
                    <Controller
                      control={control}
                      name="availabilityStartDate"
                      render={() => {
                        const isTemporary = rentalKind === HousingRentalKind.TEMPORARY;
                        const fromDate = availabilityStartDate as Date | null | undefined;
                        const toDate = availabilityEndDate as Date | null | undefined;
                        const selected = isTemporary
                          ? { from: fromDate ?? undefined, to: toDate ?? undefined }
                          : (fromDate ?? undefined);

                        // Calendar config (simple computation)
                        const today0 = startOfDay(new Date());
                        const MIN_LEAD_DAYS = 2;
                        const NAV_MONTHS_AHEAD = 3;
                        const minDate = addDays(today0, MIN_LEAD_DAYS);
                        const maxDate = isTemporary
                          ? fromDate
                            ? addMonths(startOfDay(fromDate), NAV_MONTHS_AHEAD)
                            : addMonths(minDate, NAV_MONTHS_AHEAD)
                          : addMonths(today0, NAV_MONTHS_AHEAD);
                        const defaultMonth = fromDate ?? minDate;

                        return (
                          <FormItem className="form-content-card">
                            <div className="flex flex-col">
                              <span className="space-y-1">
                                <FormLabel>Availability</FormLabel>
                                {/* Mode guidance text */}
                                <p className="text-xs text-muted-foreground">
                                  {isTemporary
                                    ? 'Select the Start date and End date.'
                                    : 'Select the Start date.'}
                                </p>
                              </span>
                            </div>
                            <div className="w-full max-w-[320px] space-y-2 mx-auto">
                              {/* Guidance bar */}
                              <div className="rounded-2xl flex divide-x border">
                                {/* Start side */}
                                <div className="flex-1 flex flex-col justify-center items-center">
                                  <div
                                    className={cn(
                                      'rounded-tl-2xl border-b flex-1/3 py-1 bg-white w-full text-xs text-center'
                                    )}
                                  >
                                    {!availabilityStartDate ? (
                                      <span className="text-primary font-semibold">Start date</span>
                                    ) : (
                                      <span className="">Start date</span>
                                    )}
                                  </div>
                                  <div className="flex-2/3 tracking-widest py-1 text-sm">
                                    {!availabilityStartDate ? (
                                      <span className="tracking-tight font-sans font-light">
                                        select a date
                                      </span>
                                    ) : (
                                      <span className="flex items-baseline gap-2">
                                        <CalendarDays size={14} />
                                        {formatDDMMYY(fromDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* End side */}
                                <div className="flex-1 flex flex-col justify-center items-center">
                                  <div className="rounded-tr-2xl border-b flex-1/3 py-1 bg-white w-full text-xs text-center">
                                    {isTemporary ? (
                                      !availabilityEndDate && availabilityStartDate ? (
                                        <span className="text-primary font-semibold">End date</span>
                                      ) : (
                                        <span className="">End date</span>
                                      )
                                    ) : (
                                      <span className="text-muted">End date</span>
                                    )}
                                  </div>
                                  <div className="flex-2/3 tracking-widest text-sm py-1">
                                    {isTemporary ? (
                                      !availabilityEndDate ? (
                                        availabilityStartDate ? (
                                          <span className="tracking-tight font-sans font-light">
                                            select a date
                                          </span>
                                        ) : (
                                          <span className="text-neutral-400">-</span>
                                        )
                                      ) : (
                                        <span className="flex items-baseline gap-2">
                                          <CalendarDays size={14} />
                                          {formatDDMMYY(toDate)}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-muted">Not required</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isTemporary ? (
                                <Calendar
                                  className={cn('w-full bg-card shadow-2xs rounded-2xl')}
                                  mode="range"
                                  selected={
                                    {
                                      from: fromDate ?? undefined,
                                      to: toDate ?? undefined,
                                    } as DateRange | undefined
                                  }
                                  defaultMonth={defaultMonth}
                                  fromDate={minDate}
                                  toDate={maxDate}
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
                                    return day < minDate || day > maxDate;
                                  }}
                                />
                              ) : (
                                <Calendar
                                  className={cn('w-full bg-card shadow-2xs rounded-2xl')}
                                  mode="single"
                                  selected={fromDate ?? undefined}
                                  defaultMonth={defaultMonth}
                                  fromDate={minDate}
                                  toDate={maxDate}
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
                                    return day < minDate || day > maxDate;
                                  }}
                                />
                              )}
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Pricing */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  {/* Row 1: Price and Deposit */}
                  <div className="flex flex-col form-content-card">
                    <FormField
                      control={control}
                      name="priceAmount"
                      render={({ field, fieldState }) => (
                        <FormItem className="">
                          <div className="flex justify-between items-baseline">
                            <FormLabel className="flex-1">Price</FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-sm space-x-2">
                                <span className="bg-emerald-500 text-white py-1 px-2 rounded-[9px] ">
                                  {form.getValues('priceType')}
                                </span>
                                <span className="">€</span>
                              </span>
                              <Input
                                className={cn(
                                  form.getValues('priceType') === HousingPriceType.DAILY
                                    ? 'pl-20'
                                    : 'pl-28'
                                )}
                                type="number"
                                inputMode="decimal"
                                disabled={priceNegotiable}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  field.onChange(
                                    e.target.value === '' ? null : Number(e.target.value)
                                  );
                                  revalidateField('priceAmount');
                                }}
                                placeholder="Enter amount"
                                aria-invalid={!!fieldState.error}
                              />
                            </div>
                          </FormControl>
                          <FormField
                            control={control}
                            name="priceNegotiable"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center gap-2 mt-2">
                                <FormControl>
                                  <Checkbox
                                    checked={!!field.value}
                                    onCheckedChange={(v) => {
                                      field.onChange(Boolean(v));
                                      // Clear priceAmount error when negotiable is checked
                                      if (v) {
                                        form.clearErrors('priceAmount');
                                      } else {
                                        // Revalidate when unchecked to show error if needed
                                        revalidateField('priceAmount');
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
                    <Separator className="my-5" />

                    <FormField
                      control={control}
                      name="depositAmount"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className={cn({ 'text-muted': isTemporary })}>
                            Deposit
                            {!isTemporary && (
                              <span className="text-xs text-neutral-400 font-light">
                                {' '}
                                ( Optional )
                              </span>
                            )}
                            {isTemporary && (
                              <span className="text-xs text-neutral-400 font-light">
                                {' '}
                                ( Not applicable for temporary )
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                                €
                              </span>
                              <Input
                                className="pl-8"
                                type="number"
                                inputMode="decimal"
                                disabled={isTemporary}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  field.onChange(
                                    e.target.value === '' ? null : Number(e.target.value)
                                  );
                                  revalidateField('depositAmount');
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
                  </div>

                  {/* Row 2: Agency Fee Amount */}
                  <div
                    className={cn('flex flex-col', {
                      'form-content-card-disabled': isTemporary,
                      'form-content-card': !isTemporary,
                    })}
                  >
                    <FormField
                      control={control}
                      name="agencyFeeAmount"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <div className="flex justify-between items-baseline">
                            <FormLabel className={cn('flex-2', { 'text-muted': isTemporary })}>
                              Property has agency fee
                              {isTemporary && (
                                <span className="text-xs text-neutral-400 font-light">
                                  {' '}
                                  ( Not applicable )
                                </span>
                              )}
                            </FormLabel>
                            <FormField
                              control={control}
                              name="hasAgencyFee"
                              render={({
                                field: agencyFeeField,
                                fieldState: agencyFeeFieldState,
                              }) => (
                                <SelectableList
                                  className="flex-1 w-full mb-1"
                                  itemClassName="justify-center"
                                  ariaLabel="Property has agency fee"
                                  value={agencyFeeField.value ?? null}
                                  onChange={(v) => {
                                    agencyFeeField.onChange(v);
                                    revalidateField('hasAgencyFee');
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
                          <FormControl>
                            {form.getValues('hasAgencyFee') && (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                                  €
                                </span>
                                <Input
                                  className="pl-8"
                                  type="number"
                                  inputMode="decimal"
                                  {...field}
                                  value={field.value ?? ''}
                                  disabled={isTemporary || !hasAgencyFee}
                                  onChange={(e) => {
                                    field.onChange(
                                      e.target.value === '' ? null : Number(e.target.value)
                                    );
                                    revalidateField('agencyFeeAmount');
                                  }}
                                  placeholder={
                                    isTemporary
                                      ? 'N/A'
                                      : hasAgencyFee
                                        ? 'Enter amount'
                                        : 'No agency fee'
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

                  {/* Row 3: Bills Monthly Estimate */}
                  <div
                    className={cn('flex flex-col', {
                      'form-content-card-disabled': isTemporary,
                      'form-content-card': !isTemporary,
                    })}
                  >
                    <FormField
                      control={control}
                      name="billsMonthlyEstimate"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <div className="flex justify-between items-baseline gap-3">
                            <FormLabel className={cn('flex-1', { 'text-muted': isTemporary })}>
                              Bills
                              {isTemporary && (
                                <span className="text-xs text-neutral-400 font-light">
                                  {' '}
                                  ( Not applicable )
                                </span>
                              )}
                            </FormLabel>
                            <FormField
                              control={control}
                              name="billsPolicy"
                              render={({
                                field: billsPolicyField,
                                fieldState: billsPolicyFieldState,
                              }) => (
                                <SelectableList
                                  className="md:flex-2 w-full mb-1"
                                  itemClassName="justify-center"
                                  ariaLabel="Bills policy selection"
                                  value={billsPolicyField.value ?? null}
                                  onChange={(v) => {
                                    billsPolicyField.onChange(v);
                                    revalidateField('billsPolicy');
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
                          <FormControl>
                            {(form.getValues('billsPolicy') === BillsPolicy.EXCLUDED ||
                              form.getValues('billsPolicy') === BillsPolicy.PARTIAL) && (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                                  €
                                </span>
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
                                    field.onChange(
                                      e.target.value === '' ? null : Number(e.target.value)
                                    );
                                    revalidateField('billsMonthlyEstimate');
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
                            )}
                          </FormControl>
                          <FormMessage />
                          {/* Optional notes about bills */}
                          <div className="mt-3">
                            <FormField
                              control={control}
                              name="billsNotes"
                              render={({ field: notesField }) => (
                                <FormItem>
                                  <FormLabel
                                    className={cn('text-sm', { 'text-muted': isTemporary })}
                                  >
                                    Additional notes (optional)
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      rows={3}
                                      placeholder="Any notes about bills"
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
                </div>
              )}

              {/* Property features (Step 4) - elegant grouped layout */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    {/* Left: common features grouped */}
                    <div className="form-content-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">Basic features</div>
                          <div className="text-xs text-muted-foreground">Common amenities</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <FormField
                          control={control}
                          name="furnished"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">🛋️</span>}
                              label="Furnished"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="hasElevator"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">⬆️</span>}
                              label="Elevator"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="privateBathroom"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">🛁</span>}
                              label="Private bathroom"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="kitchenEquipped"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">🍽️</span>}
                              label="Kitchen equipped"
                            />
                          )}
                        />
                        <FormField
                          control={control}
                          name="balcony"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">🌿</span>}
                              label="Balcony"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Right: additional features + floor + heating */}
                    <div className="form-content-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">More details</div>
                          <div className="text-xs text-muted-foreground">
                            Extra amenities & property specifics
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <FormField
                          control={control}
                          name="wifi"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">📶</span>}
                              label="Wi‑Fi"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="washingMachine"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">👕</span>}
                              label="Washing machine"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="dishwasher"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">🍽️</span>}
                              label="Dishwasher"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="doubleGlazedWindows"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">🪟</span>}
                              label="Double glazed"
                            />
                          )}
                        />

                        <FormField
                          control={control}
                          name="airConditioning"
                          render={({ field }) => (
                            <SelectableChip
                              selected={!!field.value}
                              onSelect={(s) => field.onChange(Boolean(s))}
                              icon={<span className="text-lg">❄️</span>}
                              label="Air conditioning"
                            />
                          )}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <FormField
                          control={control}
                          name="floorNumber"
                          render={({ field, fieldState }) => (
                            <FormItem className="flex items-baseline justify-between border rounded-2xl p-3">
                              <FormLabel>Floor</FormLabel>
                              <FormControl>
                                <div className="w-max">
                                  <Counter
                                    number={typeof field.value === 'number' ? field.value : 0}
                                    setNumber={(n) => {
                                      // Store numeric floor (allow negatives); keep null only if explicitly cleared elsewhere
                                      field.onChange(Number(n));
                                      revalidateField('floorNumber');
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="heatingType"
                          render={({ field, fieldState }) => (
                            <FormItem className="flex flex-col border rounded-2xl p-3">
                              <div className="flex items-baseline justify-between">
                                <FormLabel>Heating</FormLabel>
                                <FormControl>
                                  <SelectableList
                                    ariaLabel="Heating type"
                                    value={field.value ?? null}
                                    onChange={(v) => {
                                      field.onChange(v);
                                      revalidateField('heatingType');
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
                  </div>
                </div>
              )}

              {/* Household */}
              {currentStep === 5 && (
                <div className="flex flex-col space-y-4">
                  {/* current occupants & gender */}
                  <div className="form-content-card">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">Household</div>
                        <div className="text-xs text-muted-foreground">
                          Current occupants & gender
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <FormField
                        control={control}
                        name="householdSize"
                        render={({ field, fieldState }) => (
                          <FormItem className="flex items-baseline w-full justify-between border rounded-2xl p-3">
                            <FormLabel>Household size</FormLabel>
                            <FormControl>
                              <div className="w-max">
                                <Counter
                                  number={typeof field.value === 'number' ? field.value : 1}
                                  setNumber={(n) => {
                                    field.onChange(Number(n));
                                    revalidateField('householdSize');
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="householdGender"
                        render={({ field, fieldState }) => (
                          <FormItem className="flex w-full flex-col border rounded-2xl p-3">
                            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
                              <FormLabel>Household gender</FormLabel>
                              <FormControl>
                                <SelectableList
                                  className="w-full"
                                  ariaLabel="Household gender"
                                  value={field.value ?? null}
                                  onChange={(v) => {
                                    field.onChange(v);
                                    revalidateField('householdGender');
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
                      />
                    </div>
                  </div>

                  {/* preferences & description */}
                  <div className="form-content-card">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">Preferences</div>
                        <div className="text-xs text-muted-foreground">
                          Looking for & description
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <FormField
                        control={control}
                        name="genderPreference"
                        render={({ field, fieldState }) => (
                          <FormItem className="flex flex-col border rounded-2xl p-3">
                            <div className="flex items-baseline justify-between">
                              <FormLabel>Looking for</FormLabel>
                              <FormControl>
                                <SelectableList
                                  ariaLabel="Gender preference"
                                  value={field.value ?? null}
                                  onChange={(v) => {
                                    field.onChange(v);
                                    revalidateField('genderPreference');
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
                    </div>

                    <div className="flex flex-col">
                      <FormField
                        control={control}
                        name="householdDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Household description</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Tell about roommates, atmosphere, routines..."
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
                </div>
              )}

              {/* Location */}
              {currentStep === 6 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neighborhood</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., San Salvario"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="streetHint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street hint</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., near Dante metro"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={control}
                      name="lat"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.000001"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="lng"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.000001"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={control}
                      name="transitLines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transit lines (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              {...field}
                              value={(field.value || []).join('\n')}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .split('\n')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="shopsNearby"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shops nearby (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              {...field}
                              value={(field.value || []).join('\n')}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .split('\n')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              {currentStep === 7 && (
                <FormField
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (private)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Optional internal notes"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Review */}
              {currentStep === 8 && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <b>Rental kind:</b> {form.getValues().rentalKind ?? '—'}
                    </div>
                    <div>
                      <b>Unit type:</b> {form.getValues().unitType ?? '—'}
                    </div>
                    <div>
                      <b>Property type:</b>{' '}
                      {unitType === HousingUnitType.WHOLE_APARTMENT
                        ? (form.getValues().propertyType ?? '—')
                        : '—'}
                    </div>
                    {isRoomy && (
                      <div>
                        <b>Room type:</b> {form.getValues().roomType ?? '—'}
                      </div>
                    )}
                    {/* Beds fields removed */}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <b>Available from:</b>{' '}
                      {form.getValues().availabilityStartDate
                        ? new Date(form.getValues().availabilityStartDate as any).toDateString()
                        : '—'}
                    </div>
                    <div>
                      <b>Available until:</b>{' '}
                      {form.getValues().availabilityEndDate
                        ? new Date(form.getValues().availabilityEndDate as any).toDateString()
                        : '—'}
                    </div>
                    <div>
                      <b>Contract:</b> {form.getValues().contractType ?? '—'}
                    </div>
                    <div>
                      <b>Residenza:</b>{' '}
                      {form.getValues().residenzaAvailable == null
                        ? '—'
                        : form.getValues().residenzaAvailable
                          ? 'Yes'
                          : 'No'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <b>Price type:</b> {form.getValues().priceType ?? '—'}
                    </div>
                    <div>
                      <b>Negotiable:</b> {form.getValues().priceNegotiable ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <b>Price:</b> {form.getValues().priceAmount ?? '—'}
                    </div>
                    <div>
                      <b>Deposit:</b> {form.getValues().depositAmount ?? '—'}
                    </div>
                    <div>
                      <b>Agency fee:</b>{' '}
                      {hasAgencyFee ? (form.getValues().agencyFeeAmount ?? '—') : '—'}
                    </div>
                    <div>
                      <b>Bills:</b> {form.getValues().billsPolicy ?? '—'}
                    </div>
                    <div>
                      <b>Bills estimate:</b> {form.getValues().billsMonthlyEstimate ?? '—'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <b>Furnished:</b> {form.getValues().furnished ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <b>Floor:</b> {form.getValues().floorNumber ?? '—'}
                    </div>
                    <div>
                      <b>Elevator:</b> {form.getValues().hasElevator ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <b>Private bath:</b> {form.getValues().privateBathroom ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <b>Kitchen:</b> {form.getValues().kitchenEquipped ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <b>Heating:</b> {form.getValues().heatingType ?? '—'}
                    </div>
                    <div>
                      <b>AC:</b> {form.getValues().airConditioning ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <b>Household size:</b> {form.getValues().householdSize ?? '—'}
                    </div>
                    <div>
                      <b>Household gender:</b> {form.getValues().householdGender ?? '—'}
                    </div>
                    <div>
                      <b>Looking for:</b> {form.getValues().genderPreference ?? '—'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <b>Neighborhood:</b> {form.getValues().neighborhood ?? '—'}
                    </div>
                    <div>
                      <b>Street hint:</b> {form.getValues().streetHint ?? '—'}
                    </div>
                    <div>
                      <b>Latitude:</b> {form.getValues().lat ?? '—'}
                    </div>
                    <div>
                      <b>Longitude:</b> {form.getValues().lng ?? '—'}
                    </div>
                    <div>
                      <b>Transit lines:</b>{' '}
                      {(form.getValues().transitLines || []).join(', ') || '—'}
                    </div>
                    <div>
                      <b>Shops nearby:</b> {(form.getValues().shopsNearby || []).join(', ') || '—'}
                    </div>
                  </div>
                  <div>
                    <b>Notes:</b> {form.getValues().notes ?? '—'}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 px-4">
              <div className="flex w-full items-center justify-between  gap-2">
                <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  {currentStep > 1 && (
                    <Button type="button" variant="secondary" onClick={goPrev}>
                      Back
                    </Button>
                  )}
                  {currentStep < 8 && (
                    <Button type="button" className="ad-housing" onClick={goNext}>
                      Next
                    </Button>
                  )}
                  {currentStep === 8 && (
                    <Button
                      type="submit"
                      size="lg"
                      className="ad-housing hover:shadow-lg"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Publishing…' : 'Publish Ad'}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
