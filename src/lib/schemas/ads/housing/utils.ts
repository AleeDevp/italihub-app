/**
 * Utility functions for housing form validation
 */

import { z } from 'zod';

/**
 * Optional, trimmed string that treats empty strings as undefined
 */
export const optionalNonEmptyTrimmed = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().optional()
);

/**
 * Standard money validation (non-negative)
 */
export const money = z
  .number({ invalid_type_error: 'Enter a valid number' })
  .min(0, 'Amount cannot be negative');

/**
 * Integer currency input for UI fields that must be whole euros between 1 and 5000
 */
export const currencyInt = z
  .number({ invalid_type_error: 'Enter a valid number' })
  .int('Must be a whole number')
  .min(1, 'Minimum is 1')
  .max(5000, 'Maximum is 5000');

/**
 * Helper: required enum with friendly message, accepts null but rejects it with a clear error.
 * Output type is the enum itself (not null) thanks to transform.
 *
 * @param e - Enum object
 * @param message - Error message when value is null
 */
export function requiredEnum<E extends Record<string, string | number>>(
  e: E,
  message = 'Select an option!'
) {
  const values = Object.values(e).filter((v): v is string => typeof v === 'string');
  const base = z.enum(values as [string, ...string[]]);
  return z
    .union([base, z.null(), z.undefined()])
    .superRefine((v, ctx) => {
      if (v == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    })
    .transform((v) => v as z.infer<typeof base>);
}

/**
 * Validation utility functions for business logic
 */
export const validationUtils = {
  /**
   * Check if price is valid based on negotiable flag
   */
  isPriceValid: (priceAmount: number | null, priceNegotiable: boolean): boolean => {
    return priceNegotiable || priceAmount != null;
  },

  /**
   * Check if agency fee amount is valid
   */
  isAgencyFeeValid: (hasAgencyFee: boolean | null, agencyFeeAmount: number | null): boolean => {
    return !hasAgencyFee || agencyFeeAmount != null;
  },

  /**
   * Check if bills estimate is required
   */
  isBillsEstimateRequired: (billsPolicy: string | null): boolean => {
    return billsPolicy === 'EXCLUDED' || billsPolicy === 'PARTIAL';
  },

  /**
   * Check if date range is valid
   */
  isDateRangeValid: (start: Date | null, end: Date | null): boolean => {
    if (!start || !end) return false;
    return end > start;
  },
};
