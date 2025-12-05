'use server';

import {
  createHousingAdWithMedia,
  deleteHousingAd,
  getHousingAdByIdForUser,
  updateHousingAdWithMedia,
} from '@/data/ads/ad-housing';
import type {
  CreateHousingAdInput,
  MediaImageInput,
  UpdateHousingAdInput,
} from '@/data/ads/housing-types';
import type { AuditActorRole } from '@/generated/enums';
import {
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
import { logSuccess } from '@/lib/audit/audit';
import { requireUser } from '@/lib/auth/server';
import { housingSchema, pruneHousingValuesForBranch } from '@/lib/schemas/ads/housing-schema';
import { getStorageProvider } from '@/lib/storage';
import type { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

/** Raw image data structure from form JSON */
interface RawImageData {
  storageKey?: string;
  mimeType?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
}

/** Form field value type from FormData.get() */
type FormDataValue = FormDataEntryValue | null;

/**
 * Unified result type for housing ad actions (create/update)
 */
export type HousingAdActionResult =
  | { success: true; adId: number }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

/** @deprecated Use HousingAdActionResult instead */
export type CreateHousingAdResult = HousingAdActionResult;
/** @deprecated Use HousingAdActionResult instead */
export type UpdateHousingAdResult = HousingAdActionResult;

// ============================================================================
// Error Handling
// ============================================================================

/** Known domain error types from DAL */
type DomainErrorName = 'AdNotFoundError' | 'NotOwnerError' | 'CategoryMismatchError';

/** Map of domain errors to user-friendly messages */
const DOMAIN_ERROR_MESSAGES: Record<DomainErrorName, string> = {
  AdNotFoundError: 'Ad not found.',
  NotOwnerError: 'You do not have permission to perform this action.',
  CategoryMismatchError: 'Invalid ad category.',
};

/** Map of error message patterns to user-friendly messages */
const ERROR_MESSAGE_PATTERNS: Array<{ pattern: string; message: string }> = [
  { pattern: 'not found', message: 'Ad not found.' },
  { pattern: 'not the owner', message: 'You do not have permission to edit this ad.' },
  { pattern: 'Expected category', message: 'Invalid ad category.' },
  { pattern: 'At least one image is required', message: 'At least one image is required.' },
  { pattern: 'Cover image must be', message: 'Cover image must be one of the uploaded images.' },
];

/**
 * Maps errors to user-friendly result objects
 */
function handleActionError(error: unknown, context: 'create' | 'update'): HousingAdActionResult {
  if (!(error instanceof Error)) {
    return { success: false, error: 'An unexpected error occurred. Please try again later.' };
  }

  // Check for known domain error names
  const domainMessage = DOMAIN_ERROR_MESSAGES[error.name as DomainErrorName];
  if (domainMessage) {
    return { success: false, error: domainMessage };
  }

  // Check for error message patterns
  for (const { pattern, message } of ERROR_MESSAGE_PATTERNS) {
    if (error.message.includes(pattern)) {
      return { success: false, error: message };
    }
  }

  // Log unexpected errors for debugging
  console.error(`Error ${context}ing housing ad:`, error);

  return { success: false, error: 'An unexpected error occurred. Please try again later.' };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates form data and returns parsed + cleaned data
 */
function validateAndParse(formData: FormData):
  | {
      valid: true;
      data: z.infer<typeof housingSchema>;
      cleaned: ReturnType<typeof pruneHousingValuesForBranch>;
      images: MediaImageInput[];
    }
  | {
      valid: false;
      result: HousingAdActionResult;
    } {
  // Extract and parse form data
  const rawData = extractFormData(formData);

  // Validate with Zod schema
  const validation = housingSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const path = issue.path.join('.');
      if (path) fieldErrors[path] = issue.message;
    }
    return {
      valid: false,
      result: {
        success: false,
        error: 'Please fix the validation errors in the form.',
        fieldErrors,
      },
    };
  }

  // Prune and normalize data based on rental kind
  const cleaned = pruneHousingValuesForBranch(validation.data);

  // Parse images from FormData
  const images = parseImagesFromFormData(formData);
  if (!images) {
    return {
      valid: false,
      result: { success: false, error: 'Invalid image data format.' },
    };
  }

  // Validate cover image exists in uploaded images
  if (!images.some((img) => img.storageKey === cleaned.coverImageStorageKey)) {
    return {
      valid: false,
      result: { success: false, error: 'Cover image must be one of the uploaded images.' },
    };
  }

  return { valid: true, data: validation.data, cleaned, images };
}

// ============================================================================
// DAL Input Building
// ============================================================================

/**
 * Builds the common DAL input from validated data
 */
function buildDalInput(
  data: z.infer<typeof housingSchema>,
  cleaned: ReturnType<typeof pruneHousingValuesForBranch>,
  images: MediaImageInput[],
  userId: string,
  cityId: number
): Omit<CreateHousingAdInput, 'adId'> {
  return {
    userId,
    cityId,

    // Step 1: Basics
    rentalKind: data.rentalKind as HousingRentalKind,
    unitType: data.unitType as HousingUnitType,
    propertyType: data.propertyType as HousingPropertyType,

    // Step 2: Availability
    availabilityStartDate: cleaned.availabilityStartDate!,
    availabilityEndDate: cleaned.availabilityEndDate ?? null,
    contractType: (cleaned.contractType as HousingContractType) ?? null,
    residenzaAvailable: cleaned.residenzaAvailable ?? null,

    // Step 3: Pricing
    priceType: data.priceType as HousingPriceType,
    priceAmount: cleaned.priceAmount ?? null,
    priceNegotiable: cleaned.priceNegotiable ?? false,
    depositAmount: cleaned.depositAmount ?? null,
    agencyFeeAmount: cleaned.agencyFeeAmount ?? null,

    // Step 3: Bills
    billsPolicy: (cleaned.billsPolicy as BillsPolicy) ?? null,
    billsMonthlyEstimate: cleaned.billsMonthlyEstimate ?? null,
    billsNotes: cleaned.billsNotes ?? null,

    // Step 4: Features
    furnished: cleaned.furnished ?? null,
    floorNumber: cleaned.floorNumber ?? null,
    hasElevator: cleaned.hasElevator ?? null,
    privateBathroom: cleaned.privateBathroom ?? null,
    kitchenEquipped: cleaned.kitchenEquipped ?? null,
    wifi: cleaned.wifi ?? null,
    washingMachine: cleaned.washingMachine ?? null,
    dishwasher: cleaned.dishwasher ?? null,
    balcony: cleaned.balcony ?? null,
    heatingType: data.heatingType as HeatingType,
    doubleGlazedWindows: cleaned.doubleGlazedWindows ?? null,
    airConditioning: cleaned.airConditioning ?? null,
    numberOfBathrooms: cleaned.numberOfBathrooms ?? 1,
    newlyRenovated: cleaned.newlyRenovated ?? null,
    clothesDryer: cleaned.clothesDryer ?? null,

    // Step 5: Household
    householdSize: cleaned.householdSize ?? null,
    householdGender: (data.householdGender as HouseholdGender) ?? null,
    genderPreference: data.genderPreference as GenderPreference,
    householdDescription: cleaned.householdDescription ?? null,

    // Step 6: Location
    neighborhood: cleaned.neighborhood ?? null,
    streetHint: cleaned.streetHint ?? null,
    lat: cleaned.lat ?? null,
    lng: cleaned.lng ?? null,
    transitLines: cleaned.transitLines ?? [],
    shopsNearby: cleaned.shopsNearby ?? [],

    // Misc
    notes: cleaned.notes ?? null,

    // Images
    images,
    coverImageStorageKey: cleaned.coverImageStorageKey!,
  };
}

/**
 * Builds audit metadata from the form data
 */
function buildAuditMetadata(
  data: z.infer<typeof housingSchema>,
  cleaned: ReturnType<typeof pruneHousingValuesForBranch>,
  images: MediaImageInput[],
  userId: string,
  cityId: number
) {
  return {
    userId,
    cityId,
    rentalKind: data.rentalKind,
    unitType: data.unitType,
    propertyType: data.propertyType,
    priceType: data.priceType,
    priceAmount: cleaned.priceAmount,
    contractType: cleaned.contractType,
    availabilityStartDate: cleaned.availabilityStartDate?.toISOString(),
    availabilityEndDate: cleaned.availabilityEndDate?.toISOString(),
    furnished: cleaned.furnished,
    genderPreference: data.genderPreference,
    householdSize: cleaned.householdSize,
    imageCount: images.length,
    hasCoverImage: !!cleaned.coverImageStorageKey,
    hasLocation: !!(cleaned.lat && cleaned.lng),
    neighborhood: cleaned.neighborhood,
  };
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Server action to create a housing ad
 *
 * This is the only entry point for persisting housing ads to the database.
 * It validates the form data, derives the userId from the session, and calls the DAL.
 */
export async function createHousingAdAction(
  _prevState: HousingAdActionResult | null,
  formData: FormData
): Promise<HousingAdActionResult> {
  try {
    // 1. Authenticate user
    const user = await requireUser();
    if (!user.cityId) {
      return {
        success: false,
        error: 'Please complete your profile and select a city before creating an ad.',
      };
    }

    // 2. Validate and parse form data
    const validation = validateAndParse(formData);
    if (!validation.valid) return validation.result;

    const { data, cleaned, images } = validation;

    // 3. Build DAL input and create ad
    const dalInput: CreateHousingAdInput = buildDalInput(
      data,
      cleaned,
      images,
      user.id,
      user.cityId
    );
    const ad = await createHousingAdWithMedia(dalInput);

    // 4. Log to audit system
    await logSuccess(
      'AD_CREATE',
      'AD_HOUSING',
      { actorUserId: user.id, actorRole: 'USER' as AuditActorRole },
      ad.id,
      buildAuditMetadata(data, cleaned, images, user.id, user.cityId),
      'Housing ad created successfully'
    );

    return { success: true, adId: ad.id };
  } catch (error) {
    return handleActionError(error, 'create');
  }
}

/**
 * Server action to update an existing housing ad
 *
 * Validates the form data, ensures the user owns the ad, and updates via the DAL.
 * After update, the ad status is reset to PENDING for re-moderation.
 */
export async function updateHousingAdAction(
  adId: number,
  formData: FormData
): Promise<HousingAdActionResult> {
  try {
    // 1. Authenticate user
    const user = await requireUser();
    if (!user.cityId) {
      return {
        success: false,
        error: 'Please complete your profile and select a city before updating an ad.',
      };
    }

    // 2. Validate and parse form data
    const validation = validateAndParse(formData);
    if (!validation.valid) return validation.result;

    const { data, cleaned, images } = validation;

    // 3. Build DAL input and update ad
    const dalInput: UpdateHousingAdInput = {
      adId,
      ...buildDalInput(data, cleaned, images, user.id, user.cityId),
    };
    const ad = await updateHousingAdWithMedia(dalInput);

    // 4. Log to audit system
    await logSuccess(
      'AD_EDIT',
      'AD_HOUSING',
      { actorUserId: user.id, actorRole: 'USER' as AuditActorRole },
      ad.id,
      buildAuditMetadata(data, cleaned, images, user.id, user.cityId),
      'Housing ad updated successfully'
    );

    return { success: true, adId: ad.id };
  } catch (error) {
    return handleActionError(error, 'update');
  }
}

// ============================================================================
// Delete Action
// ============================================================================

/**
 * Result type for delete action
 */
export type DeleteHousingAdResult = { success: true } | { success: false; error: string };

/**
 * Server action to delete a housing ad
 *
 * Deletes the ad from the database and removes all associated images from Cloudinary.
 * Only the owner of the ad can delete it.
 */
export async function deleteHousingAdAction(adId: number): Promise<DeleteHousingAdResult> {
  try {
    // 1. Authenticate user
    const user = await requireUser();

    // 2. Fetch the ad to get image storage keys (and verify ownership)
    const ad = await getHousingAdByIdForUser(adId, user.id);
    if (!ad) {
      return {
        success: false,
        error: 'Ad not found or you do not have permission to delete it.',
      };
    }

    // 3. Collect all image storage keys for Cloudinary deletion
    const storageKeys = ad.mediaAssets
      .map((asset) => asset.storageKey)
      .filter((key): key is string => !!key);

    // 4. Delete from database first (ensures data consistency)
    await deleteHousingAd(adId, user.id);

    // 5. Delete images from Cloudinary (best effort - don't fail if this fails)
    if (storageKeys.length > 0) {
      try {
        const storage = getStorageProvider();
        await storage.deleteManyByStorageKeys(storageKeys);
      } catch (cloudinaryError) {
        // Log but don't fail - the ad is already deleted from DB
        console.error('Failed to delete images from Cloudinary:', cloudinaryError);
      }
    }

    // 6. Log to audit system
    await logSuccess(
      'AD_DELETE',
      'AD_HOUSING',
      { actorUserId: user.id, actorRole: 'USER' as AuditActorRole },
      adId,
      {
        adId,
        userId: user.id,
        deletedImageCount: storageKeys.length,
      },
      'Housing ad deleted successfully'
    );

    return { success: true };
  } catch (error) {
    // Handle known domain errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not owned')) {
        return {
          success: false,
          error: 'Ad not found or you do not have permission to delete it.',
        };
      }
    }

    console.error('Error deleting housing ad:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the ad. Please try again.',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse images from FormData imagesJson field
 */
function parseImagesFromFormData(formData: FormData): MediaImageInput[] | null {
  try {
    const imagesJson = formData.get('imagesJson');
    if (!imagesJson || typeof imagesJson !== 'string') return null;

    const parsed: unknown = JSON.parse(imagesJson);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((img: RawImageData) => ({
      storageKey: String(img.storageKey ?? ''),
      mimeType: img.mimeType ? String(img.mimeType) : null,
      alt: img.alt ? String(img.alt) : null,
      width: img.width != null ? Number(img.width) : null,
      height: img.height != null ? Number(img.height) : null,
      bytes: img.bytes != null ? Number(img.bytes) : null,
    }));
  } catch {
    return null;
  }
}

/**
 * Extract and parse form data into typed object
 */
function extractFormData(formData: FormData) {
  // Helper to parse enum
  const parseEnum = <T extends string>(
    value: FormDataValue,
    validValues: readonly T[]
  ): T | null => {
    if (typeof value !== 'string') return null;
    return validValues.includes(value as T) ? (value as T) : null;
  };

  // Helper to parse number
  const parseNumber = (value: FormDataValue): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  // Helper to parse boolean
  const parseBoolean = (value: FormDataValue): boolean => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return false;
  };

  // Helper to parse date
  const parseDate = (value: FormDataValue): Date | null => {
    if (!value || typeof value !== 'string') return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // Helper to parse array
  const parseArray = (value: FormDataValue): string[] => {
    if (typeof value !== 'string') return [];
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  };

  return {
    // Step 1: Basics
    rentalKind: parseEnum(formData.get('rentalKind'), [
      HousingRentalKind.TEMPORARY,
      HousingRentalKind.PERMANENT,
    ]),
    unitType: parseEnum(formData.get('unitType'), [
      HousingUnitType.WHOLE_APARTMENT,
      HousingUnitType.SINGLE_ROOM,
      HousingUnitType.DOUBLE_ROOM,
      HousingUnitType.TRIPLE_ROOM,
    ]),
    propertyType: parseEnum(formData.get('propertyType'), [
      HousingPropertyType.STUDIO,
      HousingPropertyType.BILOCALE,
      HousingPropertyType.TRILOCALE,
      HousingPropertyType.QUADRILOCALE,
      HousingPropertyType.OTHER,
    ]),

    // Step 2: Availability
    availabilityStartDate: parseDate(formData.get('availabilityStartDate')),
    availabilityEndDate: parseDate(formData.get('availabilityEndDate')),
    contractType: parseEnum(formData.get('contractType'), [
      HousingContractType.NONE,
      HousingContractType.SHORT_TERM,
      HousingContractType.LONG_TERM,
    ]),
    residenzaAvailable:
      formData.get('residenzaAvailable') !== null
        ? parseBoolean(formData.get('residenzaAvailable'))
        : null,

    // Step 3: Pricing
    priceType: parseEnum(formData.get('priceType'), [
      HousingPriceType.MONTHLY,
      HousingPriceType.DAILY,
    ]),
    priceAmount: parseNumber(formData.get('priceAmount')),
    priceNegotiable: parseBoolean(formData.get('priceNegotiable')),
    depositAmount: parseNumber(formData.get('depositAmount')),
    agencyFeeAmount: parseNumber(formData.get('agencyFeeAmount')),
    hasAgencyFee:
      formData.get('hasAgencyFee') !== null ? parseBoolean(formData.get('hasAgencyFee')) : null,

    // Step 3: Bills
    billsPolicy: parseEnum(formData.get('billsPolicy'), [
      BillsPolicy.INCLUDED,
      BillsPolicy.EXCLUDED,
      BillsPolicy.PARTIAL,
    ]),
    billsMonthlyEstimate: parseNumber(formData.get('billsMonthlyEstimate')),
    billsNotes: (formData.get('billsNotes') as string | null) || null,

    // Step 4: Features
    furnished: formData.get('furnished') !== null ? parseBoolean(formData.get('furnished')) : null,
    floorNumber: parseNumber(formData.get('floorNumber')),
    hasElevator:
      formData.get('hasElevator') !== null ? parseBoolean(formData.get('hasElevator')) : null,
    privateBathroom:
      formData.get('privateBathroom') !== null
        ? parseBoolean(formData.get('privateBathroom'))
        : null,
    kitchenEquipped:
      formData.get('kitchenEquipped') !== null
        ? parseBoolean(formData.get('kitchenEquipped'))
        : null,
    wifi: formData.get('wifi') !== null ? parseBoolean(formData.get('wifi')) : null,
    washingMachine:
      formData.get('washingMachine') !== null ? parseBoolean(formData.get('washingMachine')) : null,
    dishwasher:
      formData.get('dishwasher') !== null ? parseBoolean(formData.get('dishwasher')) : null,
    balcony: formData.get('balcony') !== null ? parseBoolean(formData.get('balcony')) : null,
    heatingType: parseEnum(formData.get('heatingType'), [
      HeatingType.CENTRAL,
      HeatingType.INDEPENDENT,
      HeatingType.NONE,
      HeatingType.UNKNOWN,
    ]),
    doubleGlazedWindows:
      formData.get('doubleGlazedWindows') !== null
        ? parseBoolean(formData.get('doubleGlazedWindows'))
        : null,
    airConditioning:
      formData.get('airConditioning') !== null
        ? parseBoolean(formData.get('airConditioning'))
        : null,
    numberOfBathrooms: parseNumber(formData.get('numberOfBathrooms')) ?? 1,
    newlyRenovated:
      formData.get('newlyRenovated') !== null ? parseBoolean(formData.get('newlyRenovated')) : null,
    clothesDryer:
      formData.get('clothesDryer') !== null ? parseBoolean(formData.get('clothesDryer')) : null,

    // Step 5: Household
    householdSize: parseNumber(formData.get('householdSize')),
    householdGender: parseEnum(formData.get('householdGender'), [
      HouseholdGender.MIXED,
      HouseholdGender.FEMALE_ONLY,
      HouseholdGender.MALE_ONLY,
      HouseholdGender.UNKNOWN,
    ]),
    genderPreference: parseEnum(formData.get('genderPreference'), [
      GenderPreference.ANY,
      GenderPreference.FEMALE_ONLY,
      GenderPreference.MALE_ONLY,
    ]),
    householdDescription: formData.get('householdDescription') as string | null,

    // Step 6: Location
    neighborhood: formData.get('neighborhood') as string | null,
    streetHint: formData.get('streetHint') as string | null,
    lat: parseNumber(formData.get('lat')),
    lng: parseNumber(formData.get('lng')),
    transitLines: parseArray(formData.get('transitLines')),
    shopsNearby: parseArray(formData.get('shopsNearby')),

    // Step 7: Images - extract storage keys from imagesJson
    images: (() => {
      const imagesJson = formData.get('imagesJson');
      if (!imagesJson || typeof imagesJson !== 'string') return [];
      try {
        const parsed: unknown = JSON.parse(imagesJson);
        if (!Array.isArray(parsed)) return [];
        // Extract just the storageKey from each image object
        return parsed
          .map((img: RawImageData) => img.storageKey)
          .filter((key): key is string => typeof key === 'string' && key.length > 0);
      } catch {
        return [];
      }
    })(),
    coverImageStorageKey: (formData.get('coverImageStorageKey') as string) || '',

    // Misc
    notes: formData.get('notes') as string | null,
  };
}
