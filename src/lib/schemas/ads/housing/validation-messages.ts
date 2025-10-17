/**
 * Validation error messages for housing ad form
 * Centralized for easy maintenance and future i18n support
 */

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  SELECT_OPTION: 'Select an option!',

  PRICE: {
    REQUIRED_WHEN_NOT_NEGOTIABLE: 'Price is required when not negotiable',
    MUST_BE_DAILY: 'Temporary rentals must use daily pricing',
    MUST_BE_MONTHLY: 'Permanent rentals must use monthly pricing',
    INVALID_NUMBER: 'Enter a valid number',
    CANNOT_BE_NEGATIVE: 'Amount cannot be negative',
    MUST_BE_WHOLE_NUMBER: 'Must be a whole number',
    MIN_VALUE: 'Minimum is 1',
    MAX_VALUE: 'Maximum is 5000',
  },

  DEPOSIT: {
    NOT_APPLICABLE_TEMPORARY: 'Deposit is not applicable for temporary rentals',
  },

  AGENCY: {
    NOT_APPLICABLE_TEMPORARY: 'Agency fee is not applicable for temporary rentals',
    AMOUNT_REQUIRED: 'Agency fee is required',
  },

  BILLS: {
    POLICY_NOT_APPLICABLE_TEMPORARY: 'Bills policy is not applicable for temporary rentals',
    POLICY_REQUIRED: 'Bills policy is required for permanent rentals',
    ESTIMATE_REQUIRED: 'Monthly estimate is required',
    ESTIMATE_NOT_ALLOWED: 'Do not provide a monthly estimate when bills are included',
  },

  DATE: {
    START_REQUIRED: 'Select a start date!',
    END_REQUIRED: 'End date is required for temporary rentals',
    END_AFTER_START: 'End date must be after start date',
    END_NOT_APPLICABLE: 'End date is not applicable for permanent rentals',
  },

  CONTRACT: {
    TYPE_REQUIRED: 'Select a contract type!',
    TYPE_REQUIRED_PERMANENT: 'Contract is required for permanent rentals',
  },

  RESIDENZA: {
    SELECTION_REQUIRED: 'Please select if residenza is available',
  },

  UNIT: {
    PROPERTY_TYPE_REQUIRED: 'Select an option!',
    ROOM_TYPE_REQUIRED: 'Select an option!',
  },
} as const;

/**
 * Type helper to get nested message paths
 * Usage: VALIDATION_MESSAGES.PRICE.REQUIRED_WHEN_NOT_NEGOTIABLE
 */
export type ValidationMessage = typeof VALIDATION_MESSAGES;
