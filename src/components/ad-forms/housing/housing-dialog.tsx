'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { AD_CATEGORY_BY_ID } from '@/constants/ad-categories';
import { useCityById } from '@/contexts/cities-context';
import type { AdWithHousing } from '@/data/ads/ads';
import {
  BillsPolicy,
  HousingPriceType,
  HousingPropertyType,
  HousingRentalKind,
  HousingUnitType,
} from '@/generated/prisma';
import { useConfirmBeforeClose } from '@/hooks/use-confirm-before-close';
import { useFieldRevalidation } from '@/hooks/use-field-revalidation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStepNavigation } from '@/hooks/use-step-navigation';
import { createHousingAdAction, updateHousingAdAction } from '@/lib/actions/housing-ad-actions';
import { useSession } from '@/lib/auth/client';
import {
  pruneHousingValuesForBranch,
  type HousingFormValues,
} from '@/lib/schemas/ads/housing-schema';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { FieldPath } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { AdSuccessDialog } from '../../../app/(main)/dashboard/create-ad/_components/ad-success-dialog';
import {
  HOUSING_STEP_CONFIG,
  TOTAL_STEPS,
  getStepFields,
  getStepSchema,
} from '../../../constants/housing-step-config';

/**
 * Mode for the housing dialog
 * - 'create': Creating a new housing ad
 * - 'edit': Editing an existing housing ad
 */
export type HousingDialogMode = 'create' | 'edit';

/**
 * Props for the HousingDialog component
 */
export interface HousingDialogProps {
  /** Mode: 'create' for new ads, 'edit' for existing ads */
  mode?: HousingDialogMode;
  /** Initial data for edit mode (required when mode is 'edit') */
  initialData?: AdWithHousing;
  /** Whether the dialog is controlled externally */
  open?: boolean;
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger element (only used in create mode when not controlled) */
  trigger?: React.ReactNode;
  /** Callback after successful submission */
  onSuccess?: (adId: number) => void;
  /** Initial step to display when dialog opens (1-8, defaults to 1, only for edit mode) */
  initialStep?: number;
}

/**
 * Transforms AdWithHousing data to HousingFormValues for the form
 * Handles type conversions from database types (strings) to form types (enums, numbers, dates)
 */
function transformAdToFormValues(ad: AdWithHousing): Partial<HousingFormValues> {
  const { housing, mediaAssets, coverMedia } = ad;

  return {
    // Step 1: Basics
    rentalKind: housing.rentalKind as HousingRentalKind,
    unitType: housing.unitType as HousingUnitType,
    propertyType: housing.propertyType as HousingPropertyType,

    // Step 2: Availability
    availabilityStartDate: new Date(housing.availabilityStartDate),
    availabilityEndDate: housing.availabilityEndDate ? new Date(housing.availabilityEndDate) : null,
    contractType: housing.contractType as HousingFormValues['contractType'],
    residenzaAvailable: housing.residenzaAvailable,

    // Step 3: Pricing
    priceType: housing.priceType as HousingPriceType,
    priceAmount: housing.priceAmount ? Number(housing.priceAmount) : null,
    priceNegotiable: housing.priceNegotiable,
    depositAmount: housing.depositAmount ? Number(housing.depositAmount) : null,
    hasAgencyFee: Boolean(housing.agencyFeeAmount),
    agencyFeeAmount: housing.agencyFeeAmount ? Number(housing.agencyFeeAmount) : null,

    // Step 3: Bills
    billsPolicy: housing.billsPolicy as BillsPolicy,
    billsMonthlyEstimate: housing.billsMonthlyEstimate
      ? Number(housing.billsMonthlyEstimate)
      : null,
    billsNotes: housing.billsNotes ?? undefined,

    // Step 4: Features
    furnished: housing.furnished ?? false,
    floorNumber: housing.floorNumber ?? 0,
    hasElevator: housing.hasElevator ?? false,
    privateBathroom: housing.privateBathroom ?? false,
    kitchenEquipped: housing.kitchenEquipped ?? false,
    wifi: housing.wifi ?? false,
    washingMachine: housing.washingMachine ?? false,
    dishwasher: housing.dishwasher ?? false,
    balcony: housing.balcony ?? false,
    heatingType: housing.heatingType as HousingFormValues['heatingType'],
    doubleGlazedWindows: housing.doubleGlazedWindows ?? false,
    airConditioning: housing.airConditioning ?? false,
    numberOfBathrooms: housing.numberOfBathrooms ?? 1,
    newlyRenovated: housing.newlyRenovated ?? false,
    clothesDryer: housing.clothesDryer ?? false,

    // Step 5: Household
    householdSize: housing.householdSize ?? undefined,
    householdGender: housing.householdGender as HousingFormValues['householdGender'],
    genderPreference: housing.genderPreference as HousingFormValues['genderPreference'],
    householdDescription: housing.householdDescription ?? undefined,

    // Step 6: Location
    neighborhood: housing.neighborhood ?? '',
    streetHint: housing.streetHint ?? undefined,
    lat: housing.lat ? Number(housing.lat) : null,
    lng: housing.lng ? Number(housing.lng) : null,
    transitLines: [],
    shopsNearby: [],

    // Step 7: Images
    images: mediaAssets?.map((m) => m.storageKey) ?? [],
    coverImageStorageKey: coverMedia?.storageKey ?? '',

    // Misc
    notes: housing.notes ?? undefined,
  };
}

/** Default form values for create mode */
const CREATE_MODE_DEFAULTS: Partial<HousingFormValues> = {
  floorNumber: 0,
  numberOfBathrooms: 1,
};

/**
 * Stable JSON stringifier that handles dates and circular references
 * Used for dirty state comparison
 */
function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const normalize = (v: unknown): unknown => {
    if (v instanceof Date) return v.toISOString();
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v as object)) return null;
    seen.add(v as object);
    if (Array.isArray(v)) return v.map(normalize);
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = normalize(obj[k]);
    return out;
  };
  return JSON.stringify(normalize(value));
}

export function HousingDialog({
  mode = 'create',
  initialData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess,
  initialStep,
}: HousingDialogProps = {}) {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const isEditMode = mode === 'edit';

  // Server action state
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultAdId, setResultAdId] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Edit mode: confirmation dialog before update (warns about re-approval)
  const [showUpdateConfirmDialog, setShowUpdateConfirmDialog] = useState(false);

  // Dirty state tracking: snapshot values on open and compare
  const dirtySnapshotRef = useRef<string | null>(null);

  // Reset callback - will be populated after hooks are initialized
  const resetCallbackRef = useRef<(() => void) | null>(null);

  const { open, onOpenChange, handleCancel, confirmDialog, isDirty, setIsDirty, setOpen } =
    useConfirmBeforeClose({
      onConfirmClose: () => resetCallbackRef.current?.(),
      externalOpen: controlledOpen,
      externalOnOpenChange: controlledOnOpenChange,
    });

  // No need to sync controlled state - hook handles it now
  const isMobile = useIsMobile();

  // Get user session and city information for location step
  const session = useSession();
  const userCityId = session.data?.user?.cityId;
  const userCity = useCityById(userCityId);

  // Compute default values based on mode - memoized to prevent recalculation
  const defaultValues = useMemo(
    () => (isEditMode && initialData ? transformAdToFormValues(initialData) : CREATE_MODE_DEFAULTS),
    [isEditMode, initialData]
  );

  const form = useForm<HousingFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  const { control, handleSubmit, reset } = form;

  // Map validation error state (for Step 6)
  const [mapValidationError, setMapValidationError] = useState<string | null>(null);

  // Initialize step navigation hook
  const {
    currentStep,
    goNext,
    goPrev,
    goTo,
    canNavigateTo,
    hasVisitedStep,
    reset: resetNavigation,
    markAllVisited,
  } = useStepNavigation({
    totalSteps: TOTAL_STEPS,
    form,
    getStepSchema,
    getStepFields,
    contentScrollRef,
    lazyMountSteps: [6, 7], // Lazy mount Step 6 (Map) and Step 7 (Images)
    initialStep: initialStep && isEditMode ? initialStep : undefined,
    onValidationError: (error, fields) => {
      // Handle location-specific validation errors
      const locationFields = ['neighborhood', 'lat', 'lng'];
      const hasLocationError = fields.some((f) => locationFields.includes(f));
      if (hasLocationError && error) {
        setMapValidationError(error);
      } else {
        setMapValidationError(null);
      }
    },
  });

  // Initialize field revalidation hook
  const revalidateField = useFieldRevalidation(form, currentStep, getStepSchema);

  // Helper to reset the entire dialog state consistently
  const resetDialogState = React.useCallback(() => {
    const newValues =
      isEditMode && initialData ? transformAdToFormValues(initialData) : CREATE_MODE_DEFAULTS;

    form.reset(newValues);
    resetNavigation();
    setMapValidationError(null);
    setSubmitError(null);
    setResultAdId(null);

    // Scroll to top and blur any focused element
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Establish a new clean dirty baseline after form reset completes
    setTimeout(() => {
      dirtySnapshotRef.current = stableStringify(form.getValues());
      setIsDirty(false);
    }, 0);
  }, [form, resetNavigation, setIsDirty, isEditMode, initialData]);

  // Assign reset callback for useConfirmBeforeClose
  resetCallbackRef.current = resetDialogState;

  // Track if dialog was just opened to avoid re-running effect
  const prevOpenRef = useRef(open);

  // Store initialStep in ref to avoid stale closures
  const initialStepRef = useRef(initialStep);
  useEffect(() => {
    initialStepRef.current = initialStep;
  }, [initialStep]);

  // On dialog open, set up form state based on mode
  useEffect(() => {
    // Only run when dialog opens (transitions from false to true)
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!justOpened) return;

    if (isEditMode && initialData) {
      // Edit mode: reset form with initial data and mark all steps as visited
      reset(transformAdToFormValues(initialData));
      markAllVisited?.();

      // Navigate to specified initial step if provided and valid
      const targetStep = initialStepRef.current;
      if (
        targetStep !== undefined &&
        targetStep >= 1 &&
        targetStep <= TOTAL_STEPS &&
        targetStep !== 1
      ) {
        // Use setTimeout to ensure navigation happens after form reset
        const navTimeout = setTimeout(() => {
          goTo(targetStep);
        }, 0);
        // Store timeout ID for cleanup
        return () => clearTimeout(navTimeout);
      }
    } else {
      // Create mode: reset to defaults
      const newValues = CREATE_MODE_DEFAULTS;
      form.reset(newValues);
      resetNavigation();
      setMapValidationError(null);
      setSubmitError(null);
      setResultAdId(null);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    // Establish dirty baseline after setting values
    // Use setTimeout to ensure form is fully populated before taking snapshot
    const baselineTimeout = setTimeout(() => {
      dirtySnapshotRef.current = stableStringify(form.getValues());
      setIsDirty(false);
    }, 0);

    return () => clearTimeout(baselineTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  // Helper to build FormData from cleaned values
  const buildFormData = (cleaned: HousingFormValues): FormData => {
    const formData = new FormData();

    // Step 1: Basics
    formData.append('rentalKind', cleaned.rentalKind);
    formData.append('unitType', cleaned.unitType);
    formData.append('propertyType', cleaned.propertyType);

    // Step 2: Availability
    formData.append('availabilityStartDate', cleaned.availabilityStartDate!.toISOString());
    if (cleaned.availabilityEndDate) {
      formData.append('availabilityEndDate', cleaned.availabilityEndDate.toISOString());
    }
    if (cleaned.contractType) formData.append('contractType', cleaned.contractType);
    if (cleaned.residenzaAvailable !== null) {
      formData.append('residenzaAvailable', String(cleaned.residenzaAvailable));
    }

    // Step 3: Pricing
    formData.append('priceType', cleaned.priceType);
    formData.append('priceNegotiable', String(cleaned.priceNegotiable));
    if (cleaned.priceAmount !== null) formData.append('priceAmount', String(cleaned.priceAmount));
    if (cleaned.depositAmount !== null) {
      formData.append('depositAmount', String(cleaned.depositAmount));
    }
    if (cleaned.hasAgencyFee !== null) {
      formData.append('hasAgencyFee', String(cleaned.hasAgencyFee));
    }
    if (cleaned.agencyFeeAmount !== null) {
      formData.append('agencyFeeAmount', String(cleaned.agencyFeeAmount));
    }

    // Step 3: Bills
    if (cleaned.billsPolicy) formData.append('billsPolicy', cleaned.billsPolicy);
    if (cleaned.billsMonthlyEstimate !== null) {
      formData.append('billsMonthlyEstimate', String(cleaned.billsMonthlyEstimate));
    }
    if (cleaned.billsNotes) formData.append('billsNotes', cleaned.billsNotes);

    // Step 4: Features
    if (cleaned.furnished !== null) formData.append('furnished', String(cleaned.furnished));
    if (cleaned.floorNumber !== null) formData.append('floorNumber', String(cleaned.floorNumber));
    if (cleaned.hasElevator !== null) {
      formData.append('hasElevator', String(cleaned.hasElevator));
    }
    if (cleaned.privateBathroom !== null) {
      formData.append('privateBathroom', String(cleaned.privateBathroom));
    }
    if (cleaned.kitchenEquipped !== null) {
      formData.append('kitchenEquipped', String(cleaned.kitchenEquipped));
    }
    if (cleaned.wifi !== null) formData.append('wifi', String(cleaned.wifi));
    if (cleaned.washingMachine !== null) {
      formData.append('washingMachine', String(cleaned.washingMachine));
    }
    if (cleaned.dishwasher !== null) formData.append('dishwasher', String(cleaned.dishwasher));
    if (cleaned.balcony !== null) formData.append('balcony', String(cleaned.balcony));
    formData.append('heatingType', cleaned.heatingType);
    if (cleaned.doubleGlazedWindows !== null) {
      formData.append('doubleGlazedWindows', String(cleaned.doubleGlazedWindows));
    }
    if (cleaned.airConditioning !== null) {
      formData.append('airConditioning', String(cleaned.airConditioning));
    }
    if (cleaned.numberOfBathrooms !== null) {
      formData.append('numberOfBathrooms', String(cleaned.numberOfBathrooms));
    }
    if (cleaned.newlyRenovated !== null) {
      formData.append('newlyRenovated', String(cleaned.newlyRenovated));
    }
    if (cleaned.clothesDryer !== null) {
      formData.append('clothesDryer', String(cleaned.clothesDryer));
    }

    // Step 5: Household
    if (cleaned.householdSize !== null) {
      formData.append('householdSize', String(cleaned.householdSize));
    }
    if (cleaned.householdGender) formData.append('householdGender', cleaned.householdGender);
    formData.append('genderPreference', cleaned.genderPreference);
    if (cleaned.householdDescription) {
      formData.append('householdDescription', cleaned.householdDescription);
    }

    // Step 6: Location
    if (cleaned.neighborhood) formData.append('neighborhood', cleaned.neighborhood);
    if (cleaned.streetHint) formData.append('streetHint', cleaned.streetHint);
    if (cleaned.lat !== null) formData.append('lat', String(cleaned.lat));
    if (cleaned.lng !== null) formData.append('lng', String(cleaned.lng));
    if (cleaned.transitLines?.length) {
      formData.append('transitLines', JSON.stringify(cleaned.transitLines));
    }
    if (cleaned.shopsNearby?.length) {
      formData.append('shopsNearby', JSON.stringify(cleaned.shopsNearby));
    }

    // Notes
    if (cleaned.notes) formData.append('notes', cleaned.notes);

    // Step 7: Images
    if (cleaned.images?.length) {
      const imagesData = cleaned.images.map((storageKey) => ({
        storageKey,
        mimeType: 'image/jpeg',
        alt: null,
        width: null,
        height: null,
        bytes: null,
      }));
      formData.append('imagesJson', JSON.stringify(imagesData));
    }
    if (cleaned.coverImageStorageKey) {
      formData.append('coverImageStorageKey', cleaned.coverImageStorageKey);
    }

    return formData;
  };

  /**
   * Executes the actual form submission (create or update)
   * Called directly for create mode, or after confirmation for edit mode
   */
  const executeSubmit = async (values: HousingFormValues) => {
    try {
      setSubmitError(null);

      // Prune values based on rental kind (server will validate)
      const cleaned = pruneHousingValuesForBranch(values);

      // Build FormData for server action
      const formData = buildFormData(cleaned);

      // Submit via server action
      startTransition(async () => {
        let result;

        if (isEditMode && initialData) {
          // Update existing ad (status will be set to PENDING by DAL)
          result = await updateHousingAdAction(initialData.id, formData);
        } else {
          // Create new ad
          result = await createHousingAdAction(null, formData);
        }

        if (result.success) {
          if (isEditMode) {
            // Edit mode: immediately reload the page to show updated data
            // No need to update state since page will reload
            window.location.reload();
            return;
          }

          // Create mode: update state and show success dialog
          setResultAdId(result.adId);
          setIsDirty(false);
          setOpen(false);

          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess(result.adId);
          } else {
            // Create mode: show success dialog
            setShowSuccessDialog(true);
          }
        } else {
          setSubmitError(result.error);

          // If there are field errors, set them in the form
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, message]) => {
              form.setError(field as FieldPath<HousingFormValues>, { message });
            });
          }
        }
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  /**
   * Form submit handler
   * For edit mode: shows confirmation dialog first (warns about re-approval)
   * For create mode: submits directly
   */
  const onSubmit = async (values: HousingFormValues) => {
    if (isEditMode) {
      // In edit mode, show confirmation dialog first
      setShowUpdateConfirmDialog(true);
    } else {
      // Create mode: submit directly
      await executeSubmit(values);
    }
  };

  /**
   * Called when user confirms the update in edit mode
   * Proceeds with the actual form submission
   */
  const handleConfirmUpdate = () => {
    setShowUpdateConfirmDialog(false);
    // Get current form values and execute submit
    const values = form.getValues() as HousingFormValues;
    executeSubmit(values);
  };

  // Helpers
  const rentalKind = useWatch({ control, name: 'rentalKind' });
  const propertyType = useWatch({ control, name: 'propertyType' });

  const billsPolicy = form.watch('billsPolicy');
  const priceNegotiable = !!form.watch('priceNegotiable');
  const hasAgencyFee = !!form.watch('hasAgencyFee');

  // Determine which fields should be disabled based on rental kind
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
        form.setValue('billsPolicy', undefined, { shouldDirty: true, shouldValidate: true });
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

    // unitType toggles: no separate roomType field exists anymore

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
  }, [rentalKind, priceNegotiable, hasAgencyFee, billsPolicy, isPermanent, form]);

  // New rule: if propertyType is STUDIO, force unitType to WHOLE_APARTMENT
  useEffect(() => {
    if (propertyType === HousingPropertyType.STUDIO) {
      if (form.getValues('unitType') !== HousingUnitType.WHOLE_APARTMENT) {
        form.setValue('unitType', HousingUnitType.WHOLE_APARTMENT, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  }, [propertyType, form]);

  // Use step configuration for stepper UI
  const stepDefs = HOUSING_STEP_CONFIG;

  // Watch fields relevant to current step for validation
  const stepFields = getStepFields(currentStep);
  useWatch({ control, name: stepFields as FieldPath<HousingFormValues>[] });

  // Stepper UI constants
  const INDICATOR_DIAMETER = 44;
  const CONNECTOR_LENGTH = 44;
  const LABEL_GAP_PX = 6;
  const LABEL_BLOCK_HEIGHT = 24;
  const SEGMENT_CENTER_GAP = INDICATOR_DIAMETER + CONNECTOR_LENGTH;
  const VISIBLE_STEP_COUNT = isMobile ? 3 : 5;

  // Calculate stepper positioning
  const totalWidth = INDICATOR_DIAMETER * TOTAL_STEPS + CONNECTOR_LENGTH * (TOTAL_STEPS - 1);
  const viewportWidth =
    INDICATOR_DIAMETER * VISIBLE_STEP_COUNT + CONNECTOR_LENGTH * (VISIBLE_STEP_COUNT - 1);
  const currentIdx = Math.max(0, Math.min(TOTAL_STEPS - 1, currentStep - 1));
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
  const showRightFade = hasOverflow && currentStep < TOTAL_STEPS;
  const maskGradient =
    showLeftFade && showRightFade
      ? `linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) ${MASK_FADE_PX}px, rgba(0,0,0,1) calc(100% - ${MASK_FADE_PX}px), rgba(0,0,0,0))`
      : showLeftFade && !showRightFade
        ? `linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) ${MASK_FADE_PX}px, rgba(0,0,0,1))`
        : !showLeftFade && showRightFade
          ? `linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,1) calc(100% - ${MASK_FADE_PX}px), rgba(0,0,0,0))`
          : `linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,1))`;

  // Clear map validation overlay when user fixes the related fields
  useEffect(() => {
    const e = form.formState.errors as Record<string, any>;
    if (!e || (!e.neighborhood && !e.lat && !e.lng)) {
      setMapValidationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.errors]);

  const housingCategory = AD_CATEGORY_BY_ID.HOUSING;

  // Dialog title based on mode
  const dialogTitle = isEditMode ? 'Edit housing ad' : 'Create housing ad';

  // Default trigger for create mode
  const defaultTrigger = (
    <Button size="lg" className={cn(housingCategory?.bgSecondaryColor, 'hover:shadow-lg')}>
      Start creating housing ad
    </Button>
  );

  // For edit mode without external control, we don't show a trigger
  const showTrigger = controlledOpen === undefined && mode === 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>}
      <DialogContent
        className="h-full md:h-[92vh] w-full min-w-full md:min-w-0 max-w-none md:max-w-3xl flex flex-col rounded-none md:rounded-4xl px-1"
        disableOutsideClose
        disableEscapeClose
        showCloseButton={false}
      >
        <DialogHeader className="px-6 mb-2 flex flex-col items-center justify-center">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full">
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
                const isLast = idx === TOTAL_STEPS;
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
              className={cn(
                'bg-neutral-50 h-full overflow-y-auto py-6 px-2 rounded-4xl inset-shadow-sm border',
                currentStep === 8 && 'border-2 border-neutral-200'
              )}
            >
              {/* Render steps dynamically based on configuration */}
              {HOUSING_STEP_CONFIG.map((stepConfig) => {
                const { id, component: StepComponent, lazyMount } = stepConfig;

                const isCurrentStep = currentStep === id;

                // For lazy-mounted steps, only render after first visit
                // In edit mode, all steps should be accessible
                if (lazyMount && !hasVisitedStep(id) && !isEditMode) {
                  return null;
                }

                // Hide non-current steps (but keep mounted for state persistence)
                const containerClass = isCurrentStep ? '' : 'hidden';

                if (!StepComponent) return null;

                // Build props based on step requirements
                const getStepProps = () => {
                  switch (id) {
                    case 1:
                    case 4:
                    case 5:
                      // Simple steps: only need control and revalidateField
                      return { control, revalidateField };

                    case 2:
                    case 3:
                      // Steps with conditional logic: need form, control, revalidateField
                      return { control, revalidateField, form };

                    case 6:
                      // Location step: needs all props including userCity and map validation
                      return {
                        control,
                        revalidateField,
                        form,
                        userCity,
                        mapValidationError,
                        clearMapValidationError: () => setMapValidationError(null),
                      };

                    case 7:
                      // Images step: needs form, control, revalidateField
                      return { control, form, revalidateField };

                    case 8:
                      // Review step: only needs form
                      return { form };

                    default:
                      return {};
                  }
                };

                const stepProps = getStepProps();
                const isMapStep = id === 6;

                return (
                  <div
                    key={id}
                    className={
                      isMapStep ? `flex flex-col h-full min-h-0 ${containerClass}` : containerClass
                    }
                  >
                    <StepComponent {...stepProps} />
                  </div>
                );
              })}
            </div>

            <DialogFooter className="pt-4 px-4">
              <div className="w-full">
                {/* Error message */}
                {submitError && (
                  <div className="w-full mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {submitError}
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="w-full mb-3">
                    <FormField
                      control={control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Additional Notes (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Add any additional information about your housing ad that you'd like to mention before submitting..."
                              className="min-h-[60px] resize-none placeholder:text-xs"
                              maxLength={2000}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {field.value?.length || 0}/2000 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex w-full items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <div className="flex items-center gap-2 ml-auto">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={goPrev}
                        disabled={isPending}
                      >
                        <ChevronLeft />
                        Back
                      </Button>
                    )}
                    {currentStep < 8 && (
                      <Button
                        type="button"
                        className="ad-housing"
                        onClick={goNext}
                        disabled={isPending}
                      >
                        Next <ChevronRight />
                      </Button>
                    )}
                    {/* Show Save Changes button in edit mode when form is dirty (on all steps) */}
                    {isEditMode && isDirty && (
                      <Button
                        type="submit"
                        size="lg"
                        className="ad-housing-bg-secondary hover:shadow-lg"
                        disabled={isPending}
                      >
                        {isPending ? 'Saving…' : 'Save Changes'}
                      </Button>
                    )}
                    {/* Final step submit button - only in create mode */}
                    {currentStep === 8 && !isEditMode && (
                      <Button
                        type="submit"
                        size="lg"
                        className="ad-housing-bg-secondary hover:shadow-lg"
                        disabled={isPending}
                      >
                        {isPending ? 'Submitting…' : 'Submit Ad'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      {confirmDialog}
      {/* Edit mode: Confirmation dialog before update (warns about re-approval) */}
      <ConfirmDialog
        open={showUpdateConfirmDialog}
        onOpenChange={setShowUpdateConfirmDialog}
        title="Submit changes for review?"
        description={
          <>
            Your ad will need to be reviewed and approved by our moderators before it goes live
            again.
            <br />
            <br />
            <span className="text-muted-foreground text-xs">
              This typically takes 24-48 hours. Your ad will be set to &quot;Pending&quot; status
              until approved.
            </span>
          </>
        }
        confirmText="Yes, submit for review"
        cancelText="Cancel"
        confirmVariant="default"
        onConfirm={handleConfirmUpdate}
      />
      {resultAdId && !isEditMode && (
        <AdSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          adId={resultAdId}
        />
      )}
    </Dialog>
  );
}
