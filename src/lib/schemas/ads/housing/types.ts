/**
 * TypeScript interfaces for housing validation
 * Provides strong typing for validation functions
 */

import {
  BillsPolicy,
  GenderPreference,
  HeatingType,
  HouseholdGender,
  HousingContractType,
  HousingPropertyType,
  HousingRentalKind,
  HousingRoomType,
  HousingUnitType,
} from '@/generated/prisma';

/**
 * Base fields common to both rental types
 */
export interface BaseRentalFields {
  rentalKind: HousingRentalKind;
  unitType: HousingUnitType;
  propertyType: HousingPropertyType; // ALWAYS REQUIRED - never null
  roomType: HousingRoomType | null;
  availabilityStartDate: Date | null;
}

/**
 * Pricing fields for TEMPORARY rentals
 * - Daily pricing required
 * - No deposit, agency fees, or bills policy
 */
export interface TemporaryRentalPricing {
  rentalKind: 'TEMPORARY';
  priceType: 'DAILY';
  priceAmount: number | null;
  priceNegotiable: boolean;
  depositAmount: null;
  hasAgencyFee: null;
  agencyFeeAmount: null;
  billsPolicy: null;
  billsMonthlyEstimate: null;
  billsNotes: string | null | undefined;
}

/**
 * Pricing fields for PERMANENT rentals
 * - Monthly pricing required
 * - Deposit, agency fees, and bills policy allowed
 */
export interface PermanentRentalPricing {
  rentalKind: 'PERMANENT';
  priceType: 'MONTHLY';
  priceAmount: number | null;
  priceNegotiable: boolean;
  depositAmount: number | null;
  hasAgencyFee: boolean | null;
  agencyFeeAmount: number | null;
  billsPolicy: BillsPolicy | null;
  billsMonthlyEstimate: number | null;
  billsNotes: string | null | undefined;
}

/**
 * Availability fields for TEMPORARY rentals
 * - End date required
 * - No contract type or residenza
 */
export interface TemporaryRentalAvailability {
  rentalKind: 'TEMPORARY';
  availabilityStartDate: Date | null;
  availabilityEndDate: Date | null;
  contractType: null;
  residenzaAvailable: null;
}

/**
 * Availability fields for PERMANENT rentals
 * - Contract type and residenza required
 * - No end date
 */
export interface PermanentRentalAvailability {
  rentalKind: 'PERMANENT';
  availabilityStartDate: Date | null;
  availabilityEndDate: null;
  contractType: HousingContractType | null;
  residenzaAvailable: boolean | null;
}

/**
 * Step 1 validation fields
 */
export interface Step1Fields {
  rentalKind: HousingRentalKind;
  unitType: HousingUnitType;
  propertyType: HousingPropertyType; // ALWAYS REQUIRED - never null
  roomType: HousingRoomType | null | undefined;
}

/**
 * Step 2 validation fields
 */
export interface Step2Fields {
  rentalKind: HousingRentalKind;
  availabilityStartDate: Date | null;
  availabilityEndDate: Date | null;
  contractType: HousingContractType | null | undefined;
  residenzaAvailable: boolean | null | undefined;
}

/**
 * Step 3 validation fields (Pricing)
 */
export type Step3Fields = TemporaryRentalPricing | PermanentRentalPricing;

/**
 * Property features for Step 4
 */
export interface Step4Fields {
  sizeSqM: number | null;
  bedroomCount: number | null;
  bathroomCount: number | null;
  heatingType: HeatingType | null;
  airConditioning: boolean | null;
  furnished: boolean | null;
  petsAllowed: boolean | null;
}

/**
 * Household preferences for Step 5
 */
export interface Step5Fields {
  householdCurrentCount: number | null;
  householdMaxCount: number | null;
  householdGender: HouseholdGender | null;
  tenantGenderPreference: GenderPreference | null;
  tenantAgeMin: number | null;
  tenantAgeMax: number | null;
}

/**
 * Location for Step 6
 */
export interface Step6Fields {
  city: string;
  zone: string | undefined;
}

/**
 * Notes for Step 7
 */
export interface Step7Fields {
  notes: string | undefined;
}
