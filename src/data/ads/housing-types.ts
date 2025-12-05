/**
 * Housing Ad DAL Types
 * Separate input DTOs from Prisma models for clean separation of concerns
 */

import type {
  AdCategory,
  AdStatus,
  BillsPolicy,
  GenderPreference,
  HeatingType,
  HouseholdGender,
  HousingContractType,
  HousingPriceType,
  HousingPropertyType,
  HousingRentalKind,
  HousingUnitType,
} from '@/generated/prisma';

/**
 * Input DTO for creating a housing ad
 * Independent of Prisma types, validated before hitting DAL
 */
export interface CreateHousingAdInput {
  // User and location
  userId: string;
  cityId: number;

  // Rental & Unit
  rentalKind: HousingRentalKind;
  unitType: HousingUnitType;
  propertyType: HousingPropertyType;

  // Availability & contract
  availabilityStartDate: Date;
  availabilityEndDate?: Date | null;
  contractType?: HousingContractType | null;
  residenzaAvailable?: boolean | null;

  // Pricing
  priceType: HousingPriceType;
  priceAmount?: number | null;
  priceNegotiable: boolean;
  depositAmount?: number | null;
  agencyFeeAmount?: number | null;

  // Bills
  billsPolicy?: BillsPolicy | null;
  billsMonthlyEstimate?: number | null;
  billsNotes?: string | null;

  // Property features
  furnished?: boolean | null;
  floorNumber?: number | null;
  hasElevator?: boolean | null;
  privateBathroom?: boolean | null;
  kitchenEquipped?: boolean | null;
  wifi?: boolean | null;
  washingMachine?: boolean | null;
  dishwasher?: boolean | null;
  balcony?: boolean | null;
  heatingType: HeatingType;
  doubleGlazedWindows?: boolean | null;
  airConditioning?: boolean | null;
  numberOfBathrooms?: number | null;
  newlyRenovated?: boolean | null;
  clothesDryer?: boolean | null;

  // Household
  householdSize?: number | null;
  householdGender?: HouseholdGender | null;
  genderPreference: GenderPreference;
  householdDescription?: string | null;

  // Location
  neighborhood?: string | null;
  streetHint?: string | null;
  lat?: number | null;
  lng?: number | null;
  transitLines?: string[];
  shopsNearby?: string[];

  // Misc
  notes?: string | null;

  // Images
  images: MediaImageInput[];
  coverImageStorageKey: string;
}

/**
 * Input DTO for updating a housing ad
 * Similar to create but with adId
 */
export interface UpdateHousingAdInput extends CreateHousingAdInput {
  adId: number;
}

/**
 * Media image input
 */
export interface MediaImageInput {
  storageKey: string;
  mimeType?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
}

/**
 * Housing ad with full details for detail page
 */
export interface HousingAdDetail {
  // Ad fields
  id: number;
  userId: string;
  cityId: number;
  cityName: string;
  category: AdCategory;
  status: AdStatus;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Housing-specific fields
  housing: {
    rentalKind: HousingRentalKind;
    unitType: HousingUnitType;
    propertyType: HousingPropertyType;
    availabilityStartDate: Date;
    availabilityEndDate: Date | null;
    contractType: HousingContractType;
    residenzaAvailable: boolean;
    priceType: HousingPriceType;
    priceAmount: number | null;
    priceNegotiable: boolean;
    depositAmount: number | null;
    agencyFeeAmount: number | null;
    billsPolicy: BillsPolicy;
    billsMonthlyEstimate: number | null;
    billsNotes: string | null;
    furnished: boolean | null;
    floorNumber: number | null;
    hasElevator: boolean | null;
    privateBathroom: boolean | null;
    kitchenEquipped: boolean | null;
    wifi: boolean | null;
    washingMachine: boolean | null;
    dishwasher: boolean | null;
    balcony: boolean | null;
    heatingType: HeatingType;
    doubleGlazedWindows: boolean | null;
    airConditioning: boolean | null;
    numberOfBathrooms: number | null;
    newlyRenovated: boolean | null;
    clothesDryer: boolean | null;
    householdSize: number | null;
    householdGender: HouseholdGender | null;
    genderPreference: GenderPreference;
    householdDescription: string | null;
    neighborhood: string | null;
    streetHint: string | null;
    lat: number | null;
    lng: number | null;
    transitLines: string[];
    shopsNearby: string[];
    notes: string | null;
  };

  // Media
  mediaAssets: {
    id: number;
    storageKey: string;
    mimeType: string | null;
    alt: string | null;
    order: number;
    width: number | null;
    height: number | null;
    bytes: number | null;
  }[];
  coverMediaId: number | null;
  mediaCount: number;

  // User info
  user: {
    id: string;
    name: string;
    image: string | null;
    verified: boolean;
    telegramHandle: string | null;
  };
}

/**
 * Housing ad list item for list/card views
 */
export interface HousingAdListItem {
  id: number;
  userId: string;
  cityId: number;
  cityName: string;
  status: AdStatus;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  createdAt: Date;

  // Housing preview fields
  rentalKind: HousingRentalKind;
  unitType: HousingUnitType;
  propertyType: HousingPropertyType;
  priceType: HousingPriceType;
  priceAmount: number | null;
  priceNegotiable: boolean;
  neighborhood: string | null;
  availabilityStartDate: Date;

  // Cover image
  coverImageStorageKey: string | null;
  mediaCount: number;
}

/**
 * List params for querying housing ads
 */
export interface ListHousingAdsParams {
  cityId?: number;
  status?: AdStatus;
  rentalKind?: HousingRentalKind;
  unitType?: HousingUnitType;
  propertyType?: HousingPropertyType;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sort?: 'created-desc' | 'created-asc' | 'price-asc' | 'price-desc';
}

/**
 * List params for user's own housing ads
 */
export interface ListUserHousingAdsParams {
  userId: string;
  status?: AdStatus;
  page?: number;
  pageSize?: number;
  sort?: 'created-desc' | 'created-asc';
}

/**
 * List response with pagination
 */
export interface HousingAdListResponse {
  items: HousingAdListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Domain errors
 */
export class AdNotFoundError extends Error {
  constructor(adId: number) {
    super(`Ad with id ${adId} not found`);
    this.name = 'AdNotFoundError';
  }
}

export class NotOwnerError extends Error {
  constructor(adId: number, userId: string) {
    super(`User ${userId} is not the owner of ad ${adId}`);
    this.name = 'NotOwnerError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(from: AdStatus, to: AdStatus) {
    super(`Invalid state transition from ${from} to ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export class CategoryMismatchError extends Error {
  constructor(expected: AdCategory, actual: AdCategory) {
    super(`Expected category ${expected} but found ${actual}`);
    this.name = 'CategoryMismatchError';
  }
}
