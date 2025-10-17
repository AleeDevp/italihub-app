/**
 * Validation configuration for housing forms
 * Defines which fields are required/null for each rental kind
 */

export const HOUSING_VALIDATION_CONFIG = {
  TEMPORARY: {
    pricing: {
      priceType: 'DAILY' as const,
      requiredFields: ['priceAmount OR priceNegotiable'] as const,
      nullFields: [
        'depositAmount',
        'hasAgencyFee',
        'agencyFeeAmount',
        'billsPolicy',
        'billsMonthlyEstimate',
      ] as const,
      optionalFields: ['billsNotes'] as const,
    },
    availability: {
      requiredFields: ['availabilityStartDate', 'availabilityEndDate'] as const,
      nullFields: ['contractType', 'residenzaAvailable'] as const,
      constraints: {
        endDateMustBeAfterStart: true,
      },
    },
  },
  PERMANENT: {
    pricing: {
      priceType: 'MONTHLY' as const,
      requiredFields: ['priceAmount OR priceNegotiable', 'billsPolicy'] as const,
      optionalFields: [
        'depositAmount',
        'agencyFeeAmount',
        'billsMonthlyEstimate',
        'billsNotes',
      ] as const,
      conditionalFields: {
        agencyFeeAmount: 'required when hasAgencyFee is true',
        billsMonthlyEstimate: 'required when billsPolicy is EXCLUDED or PARTIAL',
      },
    },
    availability: {
      requiredFields: ['availabilityStartDate', 'contractType', 'residenzaAvailable'] as const,
      nullFields: ['availabilityEndDate'] as const,
    },
  },
} as const;

/**
 * Type helper for validation config
 */
export type HousingValidationConfig = typeof HOUSING_VALIDATION_CONFIG;

/**
 * Helper to get fields that must be null for a rental kind
 */
export const getNullFieldsForRentalKind = (
  rentalKind: 'TEMPORARY' | 'PERMANENT',
  section: 'pricing' | 'availability'
) => {
  const config = HOUSING_VALIDATION_CONFIG[rentalKind][section];
  return 'nullFields' in config ? config.nullFields : [];
};

/**
 * Helper to get required fields for a rental kind
 */
export const getRequiredFieldsForRentalKind = (
  rentalKind: 'TEMPORARY' | 'PERMANENT',
  section: 'pricing' | 'availability'
) => {
  const config = HOUSING_VALIDATION_CONFIG[rentalKind][section];
  return 'requiredFields' in config ? config.requiredFields : [];
};
