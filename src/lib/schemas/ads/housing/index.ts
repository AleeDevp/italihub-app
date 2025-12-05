/**
 * Housing ad form schemas - Main entry point
 *
 * This module provides comprehensive validation for housing rental ads with:
 * - Discriminated unions for TEMPORARY vs PERMANENT rentals
 * - Incremental step-by-step validation
 * - Type-safe error messages
 * - Reusable validation rules
 * - Auto-transformation of dependent fields
 */

export * from './types';
export * from './utils';
export * from './validation-config';
export * from './validation-messages';

import {
  BillsPolicy,
  GenderPreference,
  HeatingType,
  HouseholdGender,
  HousingContractType,
  HousingPriceType,
  HousingPropertyType,
  HousingRentalKind,
  // HousingRoomType removed
  HousingUnitType,
} from '@/generated/prisma';
import { z } from 'zod';

import type { PermanentRentalPricing, Step2Fields, TemporaryRentalPricing } from './types';
import { currencyInt, optionalNonEmptyTrimmed, requiredEnum, validationUtils } from './utils';
import { VALIDATION_MESSAGES } from './validation-messages';

/**
 * Base schema for all housing fields
 * All fields are optional/nullable to support incremental validation
 */
const baseHousingSchema = z.object({
  // Step 1: Rental & Unit
  rentalKind: requiredEnum(HousingRentalKind),
  unitType: requiredEnum(HousingUnitType),
  propertyType: requiredEnum(HousingPropertyType, VALIDATION_MESSAGES.SELECT_OPTION),
  // roomType removed; unitType encodes room sizing

  // Step 2: Availability & contract
  availabilityStartDate: z.date().optional().nullable(),
  availabilityEndDate: z.date().optional().nullable(),
  contractType: z
    .nativeEnum(HousingContractType, { required_error: VALIDATION_MESSAGES.CONTRACT.TYPE_REQUIRED })
    .optional()
    .nullable(),
  residenzaAvailable: z.boolean().optional().nullable(),

  // Step 3: Pricing
  priceType: requiredEnum(HousingPriceType, VALIDATION_MESSAGES.SELECT_OPTION),
  priceAmount: currencyInt.optional().nullable(),
  priceNegotiable: z.boolean().default(false),
  depositAmount: currencyInt.optional().nullable(),
  hasAgencyFee: z.boolean().optional().nullable(),
  agencyFeeAmount: currencyInt.optional().nullable(),

  // Step 3: Bills
  billsPolicy: z.nativeEnum(BillsPolicy).optional().nullable(),
  billsMonthlyEstimate: currencyInt.optional().nullable(),
  billsNotes: optionalNonEmptyTrimmed,

  // Step 4: Property features
  furnished: z.boolean().default(false),
  floorNumber: z
    .number({ invalid_type_error: VALIDATION_MESSAGES.PRICE.INVALID_NUMBER })
    .int(VALIDATION_MESSAGES.PRICE.MUST_BE_WHOLE_NUMBER)
    .min(-2, 'Floor must be >= -2')
    .max(15, 'Floor must be <= 15')
    .default(0),
  hasElevator: z.boolean().default(false),
  privateBathroom: z.boolean().default(false),
  kitchenEquipped: z.boolean().default(false),
  wifi: z.boolean().default(false),
  washingMachine: z.boolean().default(false),
  dishwasher: z.boolean().default(false),
  balcony: z.boolean().default(false),
  terrace: z.boolean().default(false),
  heatingType: requiredEnum(HeatingType, VALIDATION_MESSAGES.SELECT_OPTION),
  doubleGlazedWindows: z.boolean().default(false),
  airConditioning: z.boolean().default(false),

  // New property features
  numberOfBathrooms: z
    .number({ invalid_type_error: 'Enter a valid number of bathrooms' })
    .int(VALIDATION_MESSAGES.PRICE.MUST_BE_WHOLE_NUMBER)
    .min(1, 'At least 1 bathroom')
    .max(4, 'At most 4 bathrooms')
    .default(1),
  newlyRenovated: z.boolean().default(false),
  clothesDryer: z.boolean().default(false),

  // Step 5: Household
  householdSize: z
    .number({ invalid_type_error: VALIDATION_MESSAGES.PRICE.INVALID_NUMBER })
    .int(VALIDATION_MESSAGES.PRICE.MUST_BE_WHOLE_NUMBER)
    .min(1, VALIDATION_MESSAGES.REQUIRED),
  householdGender: requiredEnum(HouseholdGender).optional().nullable(),
  genderPreference: requiredEnum(GenderPreference),
  householdDescription: z.string().max(1000, 'Too long (max 1000 chars)').optional().nullable(),

  // Step 6: Location
  neighborhood: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
  streetHint: optionalNonEmptyTrimmed,
  lat: z
    .number({ invalid_type_error: 'Enter a valid latitude' })
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90')
    .optional()
    .nullable(),
  lng: z
    .number({ invalid_type_error: 'Enter a valid longitude' })
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180')
    .optional()
    .nullable(),
  transitLines: z.array(z.string().trim().min(1, 'Line cannot be empty')).optional().default([]),
  shopsNearby: z
    .array(z.string().trim().min(1, 'Shop name cannot be empty'))
    .optional()
    .default([]),

  // Step 7: Images (new) + Notes (still available but not step-gated)
  images: z
    .array(z.string().min(1, 'Invalid image key'))
    .max(8, 'You can upload up to 8 images')
    .default([]),
  coverImageStorageKey: z.string(),
  notes: z.string().max(2000, 'Too long (max 2000 chars)').optional().nullable(),
});

/**
 * Validation rules for Step 2: Availability and contract
 *
 * **For TEMPORARY rentals:**
 * - Start date required
 * - End date required
 * - End date must be after start date
 *
 * **For PERMANENT rentals:**
 * - Start date required
 * - Contract type required
 * - Residenza availability required
 * - End date must be null
 */
function applyStep2Rules(val: Step2Fields, ctx: z.RefinementCtx) {
  // Start date is always required
  if (!val.availabilityStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.DATE.START_REQUIRED,
      path: ['availabilityStartDate'],
    });
  }

  if (val.rentalKind === HousingRentalKind.TEMPORARY) {
    // Temporary requires end date
    if (!val.availabilityEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DATE.END_REQUIRED,
        path: ['availabilityEndDate'],
      });
    }
    // Date range validation
    if (
      val.availabilityEndDate &&
      val.availabilityStartDate &&
      val.availabilityEndDate <= val.availabilityStartDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DATE.END_AFTER_START,
        path: ['availabilityEndDate'],
      });
    }
  } else if (val.rentalKind === HousingRentalKind.PERMANENT) {
    // Permanent requires contract type
    if (val.contractType == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.CONTRACT.TYPE_REQUIRED_PERMANENT,
        path: ['contractType'],
      });
    }
    // Permanent requires residenza selection
    if (val.residenzaAvailable == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.RESIDENZA.SELECTION_REQUIRED,
        path: ['residenzaAvailable'],
      });
    }
    // Permanent cannot have end date
    if (val.availabilityEndDate != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DATE.END_NOT_APPLICABLE,
        path: ['availabilityEndDate'],
      });
    }
  }
}

/**
 * Validation rules for TEMPORARY rental pricing
 *
 * **Rules:**
 * - priceType must be DAILY
 * - priceAmount required unless negotiable
 * - deposit, agency fee, bills must be null
 */
function validateTemporaryPricing(val: TemporaryRentalPricing, ctx: z.RefinementCtx) {
  // Price type must be DAILY
  if (val.priceType && val.priceType !== HousingPriceType.DAILY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.PRICE.MUST_BE_DAILY,
      path: ['priceType'],
    });
  }

  // Price required when not negotiable
  if (!validationUtils.isPriceValid(val.priceAmount, val.priceNegotiable)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.PRICE.REQUIRED_WHEN_NOT_NEGOTIABLE,
      path: ['priceAmount'],
    });
  }

  // These fields must be null for temporary
  if (val.depositAmount != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.DEPOSIT.NOT_APPLICABLE_TEMPORARY,
      path: ['depositAmount'],
    });
  }
  if (val.agencyFeeAmount != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.AGENCY.NOT_APPLICABLE_TEMPORARY,
      path: ['agencyFeeAmount'],
    });
  }
  if (val.billsPolicy != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.BILLS.POLICY_NOT_APPLICABLE_TEMPORARY,
      path: ['billsPolicy'],
    });
  }
}

/**
 * Validation rules for PERMANENT rental pricing
 *
 * **Rules:**
 * - priceType must be MONTHLY
 * - priceAmount required unless negotiable
 * - billsPolicy required
 * - agencyFeeAmount required if hasAgencyFee is true
 * - billsMonthlyEstimate required if policy is EXCLUDED or PARTIAL
 * - billsMonthlyEstimate not allowed if policy is INCLUDED
 */
function validatePermanentPricing(val: PermanentRentalPricing, ctx: z.RefinementCtx) {
  // Price type must be MONTHLY
  if (val.priceType && val.priceType !== HousingPriceType.MONTHLY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.PRICE.MUST_BE_MONTHLY,
      path: ['priceType'],
    });
  }

  // Price required when not negotiable
  if (!validationUtils.isPriceValid(val.priceAmount, val.priceNegotiable)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.PRICE.REQUIRED_WHEN_NOT_NEGOTIABLE,
      path: ['priceAmount'],
    });
  }

  // Bills policy is required
  if (val.billsPolicy == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.BILLS.POLICY_REQUIRED,
      path: ['billsPolicy'],
    });
  }

  // Agency fee selection is required
  if (val.hasAgencyFee == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select an option',
      path: ['hasAgencyFee'],
    });
  }

  // Agency fee amount validation
  if (!validationUtils.isAgencyFeeValid(val.hasAgencyFee, val.agencyFeeAmount)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.AGENCY.AMOUNT_REQUIRED,
      path: ['agencyFeeAmount'],
    });
  }

  // Bills estimate validation
  if (val.billsPolicy === BillsPolicy.INCLUDED && val.billsMonthlyEstimate != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.BILLS.ESTIMATE_NOT_ALLOWED,
      path: ['billsMonthlyEstimate'],
    });
  }
}

/**
 * Combined pricing validation for Step 3
 * Delegates to specific validators based on rental kind
 */
function applyPricingRules(
  val: TemporaryRentalPricing | PermanentRentalPricing,
  ctx: z.RefinementCtx
) {
  if (val.rentalKind === HousingRentalKind.TEMPORARY) {
    validateTemporaryPricing(val, ctx);
  } else {
    validatePermanentPricing(val, ctx);
  }
}

/**
 * Main discriminated union schema for full form
 * Uses literal types for rental kind to enable type narrowing
 */
const temporaryBranch = baseHousingSchema.extend({
  rentalKind: z.literal(HousingRentalKind.TEMPORARY),
});

const permanentBranch = baseHousingSchema.extend({
  rentalKind: z.literal(HousingRentalKind.PERMANENT),
});

/**
 * Main housing schema with full validation
 * Auto-transforms priceType based on rentalKind
 */
export const housingSchema = z
  .discriminatedUnion('rentalKind', [temporaryBranch, permanentBranch])
  .transform((val) => ({
    ...val,
    // Auto-set priceType based on rentalKind
    priceType:
      val.rentalKind === HousingRentalKind.TEMPORARY
        ? HousingPriceType.DAILY
        : HousingPriceType.MONTHLY,
  }))
  .superRefine((val, ctx) => {
    applyStep2Rules(val as any, ctx);
    applyPricingRules(val as any, ctx);
  });

export type HousingFormValues = z.infer<typeof housingSchema>;

/**
 * Step-specific validation schemas
 * Each schema validates only the fields relevant to that step
 */

/**
 * Step 1: Rental kind, unit type, property type, and room type
 *
 * @example
 * ```typescript
 * // Valid for WHOLE_APARTMENT
 * { rentalKind: 'TEMPORARY', unitType: 'WHOLE_APARTMENT', propertyType: 'STUDIO', roomType: null }
 *
 * // Valid for ROOM (propertyType is always required)
 * { rentalKind: 'PERMANENT', unitType: 'ROOM', propertyType: 'TRILOCALE', roomType: 'SINGLE' }
 * ```
 */
export const step1Schema = baseHousingSchema.pick({
  rentalKind: true,
  unitType: true,
  propertyType: true,
});

/**
 * Step 2: Availability dates and contract details
 *
 * @example
 * ```typescript
 * // Valid TEMPORARY
 * { rentalKind: 'TEMPORARY', availabilityStartDate: startDate, availabilityEndDate: endDate, contractType: null, residenzaAvailable: null }
 *
 * // Valid PERMANENT
 * { rentalKind: 'PERMANENT', availabilityStartDate: startDate, availabilityEndDate: null, contractType: 'TRANSITORIO', residenzaAvailable: true }
 * ```
 */
export const step2Schema = baseHousingSchema
  .pick({
    rentalKind: true,
    availabilityStartDate: true,
    availabilityEndDate: true,
    contractType: true,
    residenzaAvailable: true,
  })
  .superRefine((val, ctx) => applyStep2Rules(val as Step2Fields, ctx));

/**
 * Step 3: Pricing, deposit, agency fee, and bills
 *
 * @example
 * ```typescript
 * // Valid TEMPORARY
 * { rentalKind: 'TEMPORARY', priceType: 'DAILY', priceAmount: 50, priceNegotiable: false, depositAmount: null, ... }
 *
 * // Valid PERMANENT
 * { rentalKind: 'PERMANENT', priceType: 'MONTHLY', priceAmount: 800, billsPolicy: 'EXCLUDED', billsMonthlyEstimate: 100, ... }
 * ```
 */
export const step3Schema = baseHousingSchema
  .pick({
    rentalKind: true,
    priceType: true,
    priceAmount: true,
    priceNegotiable: true,
    depositAmount: true,
    hasAgencyFee: true,
    agencyFeeAmount: true,
    billsPolicy: true,
    billsMonthlyEstimate: true,
    billsNotes: true,
  })
  .transform((val) => ({
    ...val,
    // Auto-set priceType based on rentalKind
    priceType:
      val.rentalKind === HousingRentalKind.TEMPORARY
        ? HousingPriceType.DAILY
        : HousingPriceType.MONTHLY,
  }))
  .superRefine((val, ctx) => applyPricingRules(val as any, ctx));

/** Step 4: Property features and amenities */
export const step4Schema = baseHousingSchema.pick({
  heatingType: true,
  floorNumber: true,
  furnished: true,
  kitchenEquipped: true,
  privateBathroom: true,
  balcony: true,
  hasElevator: true,
  numberOfBathrooms: true,
  newlyRenovated: true,
  // Comfort & convenience
  wifi: true,
  airConditioning: true,
  dishwasher: true,
  washingMachine: true,
  clothesDryer: true,
  doubleGlazedWindows: true,
});

/** Step 5: Household information */
export const step5Schema = baseHousingSchema.pick({
  householdSize: true,
  householdGender: true,
  genderPreference: true,
  householdDescription: true,
});

/** Step 6: Location details */
export const step6Schema = baseHousingSchema.pick({
  neighborhood: true,
  streetHint: true,
  lat: true,
  lng: true,
  transitLines: true,
  shopsNearby: true,
});
// Make lat/lng/neighborhood required for step 6 (location selection)
step6Schema.superRefine((val, ctx) => {
  // neighborhood must be a non-empty string
  if (val.neighborhood == null || String(val.neighborhood).trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a location',
      path: ['neighborhood'],
    });
  }

  // lat must be present
  if (val.lat == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a location',
      path: ['lat'],
    });
  }

  // lng must be present
  if (val.lng == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a location',
      path: ['lng'],
    });
  }
});

/** Step 7: Images (requires at least 1 image and a valid cover among them) */
export const step7Schema = baseHousingSchema
  .pick({
    images: true,
    coverImageStorageKey: true,
  })
  .superRefine((val, ctx) => {
    const images = val.images || [];
    // At least 1 image required
    if (!Array.isArray(images) || images.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please upload at least one image',
        path: ['images'],
      });
    }

    // Cover must be one of the images when images exist
    if (Array.isArray(images) && images.length > 0) {
      if (!val.coverImageStorageKey || !images.includes(val.coverImageStorageKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a cover image',
          path: ['coverImageStorageKey'],
        });
      }
    }
  });

/**
 * Maps each step to the form fields it uses for watching changes
 * Used by React Hook Form's useWatch to track field changes per step
 */
export const STEP_FIELDS: Record<number, (keyof HousingFormValues)[]> = {
  1: ['rentalKind', 'unitType', 'propertyType'],
  2: [
    'rentalKind',
    'availabilityStartDate',
    'availabilityEndDate',
    'contractType',
    'residenzaAvailable',
  ],
  3: [
    'rentalKind',
    'priceType',
    'priceAmount',
    'priceNegotiable',
    'depositAmount',
    'hasAgencyFee',
    'agencyFeeAmount',
    'billsPolicy',
    'billsMonthlyEstimate',
    'billsNotes',
  ],
  4: [
    'heatingType',
    'floorNumber',
    'furnished',
    'hasElevator',
    'privateBathroom',
    'kitchenEquipped',
    'wifi',
    'washingMachine',
    'dishwasher',
    'balcony',
    'airConditioning',
    'doubleGlazedWindows',
    'numberOfBathrooms',
    'newlyRenovated',
    'clothesDryer',
  ],
  5: ['householdSize', 'householdGender', 'genderPreference', 'householdDescription'],
  6: ['neighborhood', 'streetHint', 'lat', 'lng', 'transitLines', 'shopsNearby'],
  7: ['images', 'coverImageStorageKey'],
};
/**
 * Validates a specific step with the current form values
 *
 * @param step - Step number (1-7, step 8 is review and doesn't need validation)
 * @param values - Current form values
 * @returns true if step is valid, false otherwise
 */
export function validateStep(step: number, values: Partial<HousingFormValues>): boolean {
  try {
    switch (step) {
      case 1:
        step1Schema.parse(values);
        return true;
      case 2:
        step2Schema.parse(values);
        return true;
      case 3:
        step3Schema.parse(values);
        return true;
      case 4:
        step4Schema.parse(values);
        return true;
      case 5:
        step5Schema.parse(values);
        return true;
      case 6:
        step6Schema.parse(values);
        return true;
      case 7:
        step7Schema.parse(values);
        return true;
      case 8:
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Prunes fields that are not applicable for the current rental kind before submission
 *
 * This ensures that:
 * - TEMPORARY rentals don't send contract/deposit/bills fields
 * - PERMANENT rentals don't send end date
 * - Conditional fields are cleared when their condition is false
 *
 * @param values - Form values to prune
 * @returns Pruned values ready for submission
 *
 * @example
 * ```typescript
 * const cleanedValues = pruneHousingValuesForBranch(formValues);
 * await submitHousingAd(cleanedValues);
 * ```
 */
export function pruneHousingValuesForBranch<T extends Partial<HousingFormValues>>(values: T): T {
  const out: any = { ...values };

  // Rental kind branch
  if (out.rentalKind === HousingRentalKind.PERMANENT) {
    // Permanent: clear end date, set monthly pricing
    out.availabilityEndDate = null;
    out.priceType = HousingPriceType.MONTHLY;
  } else if (out.rentalKind === HousingRentalKind.TEMPORARY) {
    // Temporary: clear contract fields, set daily pricing, clear deposit/agency/bills
    out.contractType = null;
    out.residenzaAvailable = null;
    out.priceType = HousingPriceType.DAILY;
    out.depositAmount = null;
    out.agencyFeeAmount = null;
    out.hasAgencyFee = null;
    out.billsPolicy = null;
    out.billsMonthlyEstimate = null;
    out.billsNotes = null;
  }

  // Unit type branch
  if (out.unitType === HousingUnitType.WHOLE_APARTMENT) {
    out.roomType = null;
  }

  // Pricing toggles (only for permanent)
  if (out.priceNegotiable) {
    out.priceAmount = null;
  }
  if (!out.hasAgencyFee && out.rentalKind === HousingRentalKind.PERMANENT) {
    out.agencyFeeAmount = null;
  }
  if (
    out.rentalKind === HousingRentalKind.PERMANENT &&
    !(out.billsPolicy === BillsPolicy.EXCLUDED || out.billsPolicy === BillsPolicy.PARTIAL)
  ) {
    out.billsMonthlyEstimate = null;
  }

  return out as T;
}
