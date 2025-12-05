/**
 * Housing Ad Data Access Layer (DAL)
 *
 * This module provides server-only functions for managing housing ads with:
 * - Atomic transactions for multi-table operations
 * - Rental-kind specific validation and field mapping
 * - Media asset management with cover image handling
 * - Type-safe discriminated unions
 * - Domain-specific error handling
 *
 * @see docs/ad/db_ad_housing_Important_notes.md for implementation guidelines
 */

import {
  AdCategory,
  AdStatus,
  BillsPolicy,
  HousingContractType,
  HousingRentalKind,
  MediaRole,
} from '@/generated/prisma';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

import type {
  AdNotFoundError,
  CategoryMismatchError,
  CreateHousingAdInput,
  HousingAdDetail,
  HousingAdListItem,
  HousingAdListResponse,
  ListHousingAdsParams,
  ListUserHousingAdsParams,
  NotOwnerError,
  UpdateHousingAdInput,
} from './housing-types';

export * from './housing-types';

/**
 * Helper: Convert number to Prisma Decimal
 */
function toDecimal(value: number | null | undefined): Decimal | null {
  if (value == null) return null;
  return new Decimal(value);
}

/**
 * Helper: Convert Prisma Decimal to number
 */
function fromDecimal(value: Decimal | null | undefined): number | null {
  if (value == null) return null;
  return value.toNumber();
}

/**
 * Normalize housing input based on rental kind
 * Ensures only applicable fields are set for each rental type
 */
function normalizeHousingInput(input: CreateHousingAdInput | UpdateHousingAdInput) {
  const isTemporary = input.rentalKind === HousingRentalKind.TEMPORARY;
  const isPermanent = input.rentalKind === HousingRentalKind.PERMANENT;

  return {
    // Always required
    rentalKind: input.rentalKind,
    unitType: input.unitType,
    propertyType: input.propertyType,
    availabilityStartDate: input.availabilityStartDate,
    priceType: input.priceType,
    priceNegotiable: input.priceNegotiable,
    heatingType: input.heatingType,
    genderPreference: input.genderPreference,

    // Conditional: TEMPORARY only
    availabilityEndDate: isTemporary ? input.availabilityEndDate : null,

    // Conditional: PERMANENT only
    // Note: contractType defaults to NONE for temporary, billsPolicy defaults to INCLUDED for temporary
    contractType: isPermanent
      ? (input.contractType ?? HousingContractType.NONE)
      : HousingContractType.NONE,
    residenzaAvailable: isPermanent ? (input.residenzaAvailable ?? false) : false,
    depositAmount: isPermanent ? toDecimal(input.depositAmount) : null,
    agencyFeeAmount: isPermanent ? toDecimal(input.agencyFeeAmount) : null,
    billsPolicy: isPermanent ? (input.billsPolicy ?? BillsPolicy.EXCLUDED) : BillsPolicy.INCLUDED,
    billsMonthlyEstimate: isPermanent ? toDecimal(input.billsMonthlyEstimate) : null,
    billsNotes: isPermanent ? input.billsNotes : null,

    // Price (nullable if negotiable)
    priceAmount: input.priceNegotiable ? null : toDecimal(input.priceAmount),

    // Optional features (default to null/false if not provided)
    furnished: input.furnished ?? null,
    floorNumber: input.floorNumber ?? null,
    hasElevator: input.hasElevator ?? null,
    privateBathroom: input.privateBathroom ?? null,
    kitchenEquipped: input.kitchenEquipped ?? null,
    wifi: input.wifi ?? null,
    washingMachine: input.washingMachine ?? null,
    dishwasher: input.dishwasher ?? null,
    balcony: input.balcony ?? null,
    doubleGlazedWindows: input.doubleGlazedWindows ?? null,
    airConditioning: input.airConditioning ?? null,
    numberOfBathrooms: input.numberOfBathrooms ?? 1,
    newlyRenovated: input.newlyRenovated ?? null,
    clothesDryer: input.clothesDryer ?? null,

    // Household
    householdSize: input.householdSize ?? null,
    householdGender: input.householdGender ?? null,
    householdDescription: input.householdDescription ?? null,

    // Location
    neighborhood: input.neighborhood ?? null,
    streetHint: input.streetHint ?? null,
    lat: toDecimal(input.lat),
    lng: toDecimal(input.lng),
    transitLines: input.transitLines ?? [],
    shopsNearby: input.shopsNearby ?? [],

    // Misc
    notes: input.notes ?? null,
  };
}

/**
 * Create a new housing ad with media assets in a single atomic transaction
 *
 * @param input - Validated housing ad data
 * @returns Created ad with full details
 *
 * @throws {Error} If transaction fails
 *
 * @example
 * ```typescript
 * const ad = await createHousingAdWithMedia({
 *   userId: 'user-123',
 *   cityId: 1,
 *   rentalKind: HousingRentalKind.PERMANENT,
 *   unitType: HousingUnitType.SINGLE_ROOM,
 *   propertyType: HousingPropertyType.TRILOCALE,
 *   availabilityStartDate: new Date('2024-01-01'),
 *   contractType: HousingContractType.LONG_TERM,
 *   residenzaAvailable: true,
 *   priceType: HousingPriceType.MONTHLY,
 *   priceAmount: 600,
 *   priceNegotiable: false,
 *   billsPolicy: BillsPolicy.EXCLUDED,
 *   billsMonthlyEstimate: 100,
 *   heatingType: HeatingType.CENTRAL,
 *   genderPreference: GenderPreference.ANY,
 *   images: [
 *     { storageKey: 'ads/123/img1.jpg', mimeType: 'image/jpeg' },
 *     { storageKey: 'ads/123/img2.jpg', mimeType: 'image/jpeg' },
 *   ],
 *   coverImageStorageKey: 'ads/123/img1.jpg',
 * });
 * ```
 */
export async function createHousingAdWithMedia(
  input: CreateHousingAdInput
): Promise<HousingAdDetail> {
  // Validate: At least one image required
  if (!input.images || input.images.length === 0) {
    throw new Error('At least one image is required');
  }

  // Validate: Cover image must be in images array
  const coverImageExists = input.images.some(
    (img) => img.storageKey === input.coverImageStorageKey
  );
  if (!coverImageExists) {
    throw new Error('Cover image must be one of the uploaded images');
  }

  // Normalize housing data based on rental kind
  const housingData = normalizeHousingInput(input);

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Ad
    const ad = await tx.ad.create({
      data: {
        userId: input.userId,
        cityId: input.cityId,
        category: AdCategory.HOUSING,
        status: AdStatus.PENDING,
        expirationDate: input.availabilityStartDate, // Housing expiry = availability start date
        mediaCount: input.images.length,
      },
    });

    // 2. Create AdHousing
    await tx.adHousing.create({
      data: {
        adId: ad.id,
        rentalKind: housingData.rentalKind,
        unitType: housingData.unitType,
        propertyType: housingData.propertyType,
        availabilityStartDate: housingData.availabilityStartDate,
        availabilityEndDate: housingData.availabilityEndDate ?? null,
        contractType: housingData.contractType,
        residenzaAvailable: housingData.residenzaAvailable,
        priceType: housingData.priceType,
        priceAmount: housingData.priceAmount ?? null,
        priceNegotiable: housingData.priceNegotiable,
        depositAmount: housingData.depositAmount ?? null,
        agencyFeeAmount: housingData.agencyFeeAmount ?? null,
        billsPolicy: housingData.billsPolicy,
        billsMonthlyEstimate: housingData.billsMonthlyEstimate ?? null,
        billsNotes: housingData.billsNotes ?? null,
        furnished: housingData.furnished,
        floorNumber: housingData.floorNumber,
        hasElevator: housingData.hasElevator,
        privateBathroom: housingData.privateBathroom,
        kitchenEquipped: housingData.kitchenEquipped,
        wifi: housingData.wifi,
        washingMachine: housingData.washingMachine,
        dishwasher: housingData.dishwasher,
        balcony: housingData.balcony,
        heatingType: housingData.heatingType,
        doubleGlazedWindows: housingData.doubleGlazedWindows,
        airConditioning: housingData.airConditioning,
        numberOfBathrooms: housingData.numberOfBathrooms,
        newlyRenovated: housingData.newlyRenovated,
        clothesDryer: housingData.clothesDryer,
        householdSize: housingData.householdSize,
        householdGender: housingData.householdGender,
        genderPreference: housingData.genderPreference,
        householdDescription: housingData.householdDescription,
        neighborhood: housingData.neighborhood,
        streetHint: housingData.streetHint,
        lat: housingData.lat,
        lng: housingData.lng,
        transitLines: housingData.transitLines,
        shopsNearby: housingData.shopsNearby,
        notes: housingData.notes,
      },
    });

    // 3. Create MediaAssets
    const mediaAssets = await Promise.all(
      input.images.map((img, index) =>
        tx.mediaAsset.create({
          data: {
            adId: ad.id,
            role: MediaRole.GALLERY,
            storageKey: img.storageKey,
            mimeType: img.mimeType ?? null,
            alt: img.alt ?? null,
            width: img.width ?? null,
            height: img.height ?? null,
            bytes: img.bytes ?? null,
            order: index,
          },
        })
      )
    );

    // 4. Find cover media ID and update Ad
    const coverMedia = mediaAssets.find((m) => m.storageKey === input.coverImageStorageKey);
    if (!coverMedia) {
      throw new Error('Cover media not found after creation');
    }

    await tx.ad.update({
      where: { id: ad.id },
      data: { coverMediaId: coverMedia.id },
    });

    // 5. Fetch and return complete ad with relations
    const completeAd = await tx.ad.findUnique({
      where: { id: ad.id },
      include: {
        housing: true,
        mediaAssets: {
          orderBy: { order: 'asc' },
        },
        city: {
          select: { name: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
            telegramHandle: true,
          },
        },
      },
    });

    if (!completeAd || !completeAd.housing) {
      throw new Error('Failed to fetch created ad');
    }

    // Map to HousingAdDetail
    return mapToHousingAdDetail(completeAd);
  });

  return result;
}

/**
 * Update an existing housing ad with media assets in a single atomic transaction
 *
 * @param input - Updated housing ad data with adId
 * @returns Updated ad with full details
 *
 * @throws {AdNotFoundError} If ad doesn't exist
 * @throws {NotOwnerError} If user is not the owner
 * @throws {CategoryMismatchError} If ad is not a housing ad
 *
 * @example
 * ```typescript
 * const updatedAd = await updateHousingAdWithMedia({
 *   adId: 123,
 *   userId: 'user-123',
 *   cityId: 1,
 *   // ... other fields same as create
 * });
 * ```
 */
export async function updateHousingAdWithMedia(
  input: UpdateHousingAdInput
): Promise<HousingAdDetail> {
  // Validate: At least one image required
  if (!input.images || input.images.length === 0) {
    throw new Error('At least one image is required');
  }

  // Validate: Cover image must be in images array
  const coverImageExists = input.images.some(
    (img) => img.storageKey === input.coverImageStorageKey
  );
  if (!coverImageExists) {
    throw new Error('Cover image must be one of the uploaded images');
  }

  // Normalize housing data based on rental kind
  const housingData = normalizeHousingInput(input);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify ad exists and user is owner
    const existingAd = await tx.ad.findUnique({
      where: { id: input.adId },
      include: { housing: true },
    });

    if (!existingAd) {
      throw new Error(`Ad with id ${input.adId} not found`) as AdNotFoundError;
    }

    if (existingAd.userId !== input.userId) {
      throw new Error(`User ${input.userId} is not the owner of ad ${input.adId}`) as NotOwnerError;
    }

    if (existingAd.category !== AdCategory.HOUSING) {
      throw new Error(
        `Expected category HOUSING but found ${existingAd.category}`
      ) as CategoryMismatchError;
    }

    // 2. Update Ad
    await tx.ad.update({
      where: { id: input.adId },
      data: {
        cityId: input.cityId,
        expirationDate: input.availabilityStartDate,
        mediaCount: input.images.length,
        status: AdStatus.PENDING, // Reset to pending on edit
        updatedAt: new Date(),
      },
    });

    // 3. Update AdHousing
    await tx.adHousing.update({
      where: { adId: input.adId },
      data: {
        rentalKind: housingData.rentalKind,
        unitType: housingData.unitType,
        propertyType: housingData.propertyType,
        availabilityStartDate: housingData.availabilityStartDate,
        availabilityEndDate: housingData.availabilityEndDate ?? null,
        contractType: housingData.contractType,
        residenzaAvailable: housingData.residenzaAvailable,
        priceType: housingData.priceType,
        priceAmount: housingData.priceAmount ?? null,
        priceNegotiable: housingData.priceNegotiable,
        depositAmount: housingData.depositAmount ?? null,
        agencyFeeAmount: housingData.agencyFeeAmount ?? null,
        billsPolicy: housingData.billsPolicy,
        billsMonthlyEstimate: housingData.billsMonthlyEstimate ?? null,
        billsNotes: housingData.billsNotes ?? null,
        furnished: housingData.furnished,
        floorNumber: housingData.floorNumber,
        hasElevator: housingData.hasElevator,
        privateBathroom: housingData.privateBathroom,
        kitchenEquipped: housingData.kitchenEquipped,
        wifi: housingData.wifi,
        washingMachine: housingData.washingMachine,
        dishwasher: housingData.dishwasher,
        balcony: housingData.balcony,
        heatingType: housingData.heatingType,
        doubleGlazedWindows: housingData.doubleGlazedWindows,
        airConditioning: housingData.airConditioning,
        numberOfBathrooms: housingData.numberOfBathrooms,
        newlyRenovated: housingData.newlyRenovated,
        clothesDryer: housingData.clothesDryer,
        householdSize: housingData.householdSize,
        householdGender: housingData.householdGender,
        genderPreference: housingData.genderPreference,
        householdDescription: housingData.householdDescription,
        neighborhood: housingData.neighborhood,
        streetHint: housingData.streetHint,
        lat: housingData.lat,
        lng: housingData.lng,
        transitLines: housingData.transitLines,
        shopsNearby: housingData.shopsNearby,
        notes: housingData.notes,
      },
    });

    // 4. Delete old media assets
    await tx.mediaAsset.deleteMany({
      where: { adId: input.adId },
    });

    // 5. Create new media assets
    const mediaAssets = await Promise.all(
      input.images.map((img, index) =>
        tx.mediaAsset.create({
          data: {
            adId: input.adId,
            role: MediaRole.GALLERY,
            storageKey: img.storageKey,
            mimeType: img.mimeType ?? null,
            alt: img.alt ?? null,
            width: img.width ?? null,
            height: img.height ?? null,
            bytes: img.bytes ?? null,
            order: index,
          },
        })
      )
    );

    // 6. Find cover media ID and update Ad
    const coverMedia = mediaAssets.find((m) => m.storageKey === input.coverImageStorageKey);
    if (!coverMedia) {
      throw new Error('Cover media not found after creation');
    }

    await tx.ad.update({
      where: { id: input.adId },
      data: { coverMediaId: coverMedia.id },
    });

    // 7. Fetch and return complete ad with relations
    const completeAd = await tx.ad.findUnique({
      where: { id: input.adId },
      include: {
        housing: true,
        mediaAssets: {
          orderBy: { order: 'asc' },
        },
        city: {
          select: { name: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            verified: true,
            telegramHandle: true,
          },
        },
      },
    });

    if (!completeAd || !completeAd.housing) {
      throw new Error('Failed to fetch updated ad');
    }

    return mapToHousingAdDetail(completeAd);
  });

  return result;
}

/**
 * Get a housing ad by ID with full details
 *
 * @param adId - Ad ID
 * @returns Full ad details or null if not found
 *
 * @example
 * ```typescript
 * const ad = await getHousingAdById(123);
 * if (ad) {
 *   console.log(ad.housing.priceAmount);
 * }
 * ```
 */
export async function getHousingAdById(adId: number): Promise<HousingAdDetail | null> {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    include: {
      housing: true,
      mediaAssets: {
        orderBy: { order: 'asc' },
      },
      city: {
        select: { name: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          verified: true,
          telegramHandle: true,
        },
      },
    },
  });

  if (!ad || !ad.housing || ad.category !== AdCategory.HOUSING) {
    return null;
  }

  return mapToHousingAdDetail(ad);
}

/**
 * Get a housing ad by ID ensuring user is the owner
 *
 * @param adId - Ad ID
 * @param userId - User ID
 * @returns Full ad details or null if not found or not owner
 */
export async function getHousingAdByIdForUser(
  adId: number,
  userId: string
): Promise<HousingAdDetail | null> {
  const ad = await prisma.ad.findFirst({
    where: {
      id: adId,
      userId: userId,
      category: AdCategory.HOUSING,
    },
    include: {
      housing: true,
      mediaAssets: {
        orderBy: { order: 'asc' },
      },
      city: {
        select: { name: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          verified: true,
          telegramHandle: true,
        },
      },
    },
  });

  if (!ad || !ad.housing) {
    return null;
  }

  return mapToHousingAdDetail(ad);
}

/**
 * List housing ads with filtering and pagination
 *
 * @param params - Filter and pagination parameters
 * @returns Paginated list of housing ads
 *
 * @example
 * ```typescript
 * const result = await listHousingAds({
 *   cityId: 1,
 *   status: AdStatus.ONLINE,
 *   rentalKind: HousingRentalKind.PERMANENT,
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export async function listHousingAds(params: ListHousingAdsParams): Promise<HousingAdListResponse> {
  const {
    cityId,
    status,
    rentalKind,
    unitType,
    propertyType,
    minPrice,
    maxPrice,
    page = 1,
    pageSize = 20,
    sort = 'created-desc',
  } = params;

  // Build where clause
  const where: any = {
    category: AdCategory.HOUSING,
  };

  if (cityId) where.cityId = cityId;
  if (status) where.status = status;

  // Housing-specific filters
  const housingWhere: any = {};
  if (rentalKind) housingWhere.rentalKind = rentalKind;
  if (unitType) housingWhere.unitType = unitType;
  if (propertyType) housingWhere.propertyType = propertyType;

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    housingWhere.priceAmount = {};
    if (minPrice !== undefined) housingWhere.priceAmount.gte = new Decimal(minPrice);
    if (maxPrice !== undefined) housingWhere.priceAmount.lte = new Decimal(maxPrice);
  }

  if (Object.keys(housingWhere).length > 0) {
    where.housing = housingWhere;
  }

  // Build orderBy
  const orderBy: any = {};
  switch (sort) {
    case 'created-asc':
      orderBy.createdAt = 'asc';
      break;
    case 'price-asc':
      orderBy.housing = { priceAmount: 'asc' };
      break;
    case 'price-desc':
      orderBy.housing = { priceAmount: 'desc' };
      break;
    case 'created-desc':
    default:
      orderBy.createdAt = 'desc';
      break;
  }

  // Execute query with pagination
  const [items, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        housing: {
          select: {
            rentalKind: true,
            unitType: true,
            propertyType: true,
            priceType: true,
            priceAmount: true,
            priceNegotiable: true,
            neighborhood: true,
            availabilityStartDate: true,
          },
        },
        coverMedia: {
          select: { storageKey: true },
        },
        city: {
          select: { name: true },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ad.count({ where }),
  ]);

  const mappedItems: HousingAdListItem[] = items
    .filter((ad) => ad.housing) // Ensure housing exists
    .map((ad) => ({
      id: ad.id,
      userId: ad.userId,
      cityId: ad.cityId,
      cityName: ad.city.name,
      status: ad.status,
      expirationDate: ad.expirationDate,
      viewsCount: ad.viewsCount,
      contactClicksCount: ad.contactClicksCount,
      createdAt: ad.createdAt,
      rentalKind: ad.housing!.rentalKind,
      unitType: ad.housing!.unitType,
      propertyType: ad.housing!.propertyType,
      priceType: ad.housing!.priceType,
      priceAmount: fromDecimal(ad.housing!.priceAmount),
      priceNegotiable: ad.housing!.priceNegotiable,
      neighborhood: ad.housing!.neighborhood,
      availabilityStartDate: ad.housing!.availabilityStartDate,
      coverImageStorageKey: ad.coverMedia?.storageKey ?? null,
      mediaCount: ad.mediaCount,
    }));

  return {
    items: mappedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * List user's own housing ads
 *
 * @param params - User ID and filter parameters
 * @returns Paginated list of user's housing ads
 *
 * @example
 * ```typescript
 * const result = await listUserHousingAds({
 *   userId: 'user-123',
 *   status: AdStatus.ONLINE,
 *   page: 1,
 *   pageSize: 10,
 * });
 * ```
 */
export async function listUserHousingAds(
  params: ListUserHousingAdsParams
): Promise<HousingAdListResponse> {
  const { userId, status, page = 1, pageSize = 20, sort = 'created-desc' } = params;

  const where: any = {
    userId,
    category: AdCategory.HOUSING,
  };

  if (status) where.status = status;

  const orderBy: any = sort === 'created-asc' ? { createdAt: 'asc' } : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        housing: {
          select: {
            rentalKind: true,
            unitType: true,
            propertyType: true,
            priceType: true,
            priceAmount: true,
            priceNegotiable: true,
            neighborhood: true,
            availabilityStartDate: true,
          },
        },
        coverMedia: {
          select: { storageKey: true },
        },
        city: {
          select: { name: true },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ad.count({ where }),
  ]);

  const mappedItems: HousingAdListItem[] = items
    .filter((ad) => ad.housing)
    .map((ad) => ({
      id: ad.id,
      userId: ad.userId,
      cityId: ad.cityId,
      cityName: ad.city.name,
      status: ad.status,
      expirationDate: ad.expirationDate,
      viewsCount: ad.viewsCount,
      contactClicksCount: ad.contactClicksCount,
      createdAt: ad.createdAt,
      rentalKind: ad.housing!.rentalKind,
      unitType: ad.housing!.unitType,
      propertyType: ad.housing!.propertyType,
      priceType: ad.housing!.priceType,
      priceAmount: fromDecimal(ad.housing!.priceAmount),
      priceNegotiable: ad.housing!.priceNegotiable,
      neighborhood: ad.housing!.neighborhood,
      availabilityStartDate: ad.housing!.availabilityStartDate,
      coverImageStorageKey: ad.coverMedia?.storageKey ?? null,
      mediaCount: ad.mediaCount,
    }));

  return {
    items: mappedItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Lifecycle: Submit housing ad for review
 * Transitions from DRAFT to PENDING
 */
export async function submitHousingAdForReview(adId: number, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ad = await tx.ad.findFirst({
      where: { id: adId, userId, category: AdCategory.HOUSING },
    });

    if (!ad) {
      throw new Error(`Ad ${adId} not found or not owned by user`) as AdNotFoundError;
    }

    await tx.ad.update({
      where: { id: adId },
      data: { status: AdStatus.PENDING },
    });
  });
}

/**
 * Lifecycle: Approve ad (moderator action)
 * Transitions from PENDING to ONLINE
 */
export async function approveHousingAd(adId: number): Promise<void> {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    select: { status: true, category: true },
  });

  if (!ad) {
    throw new Error(`Ad ${adId} not found`) as AdNotFoundError;
  }

  if (ad.category !== AdCategory.HOUSING) {
    throw new Error(`Ad ${adId} is not a housing ad`) as CategoryMismatchError;
  }

  await prisma.ad.update({
    where: { id: adId },
    data: { status: AdStatus.ONLINE },
  });
}

/**
 * Lifecycle: Reject ad (moderator action)
 * Transitions from PENDING to REJECTED
 */
export async function rejectHousingAd(adId: number, reason?: string): Promise<void> {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    select: { status: true, category: true },
  });

  if (!ad) {
    throw new Error(`Ad ${adId} not found`) as AdNotFoundError;
  }

  if (ad.category !== AdCategory.HOUSING) {
    throw new Error(`Ad ${adId} is not a housing ad`) as CategoryMismatchError;
  }

  await prisma.ad.update({
    where: { id: adId },
    data: { status: AdStatus.REJECTED },
  });

  // TODO: Create notification for user with rejection reason
}

/**
 * Lifecycle: Delete ad (user action)
 * Permanently removes ad and all related data
 */
export async function deleteHousingAd(adId: number, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ad = await tx.ad.findFirst({
      where: { id: adId, userId, category: AdCategory.HOUSING },
    });

    if (!ad) {
      throw new Error(`Ad ${adId} not found or not owned by user`) as AdNotFoundError;
    }

    // Cascade deletes will handle AdHousing and MediaAssets
    await tx.ad.delete({
      where: { id: adId },
    });
  });
}

/**
 * Refresh ad expiration date based on availability start date
 */
export async function refreshHousingAdExpiration(adId: number, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const ad = await tx.ad.findFirst({
      where: { id: adId, userId, category: AdCategory.HOUSING },
      include: { housing: true },
    });

    if (!ad || !ad.housing) {
      throw new Error(`Ad ${adId} not found or not owned by user`) as AdNotFoundError;
    }

    await tx.ad.update({
      where: { id: adId },
      data: { expirationDate: ad.housing.availabilityStartDate },
    });
  });
}

/**
 * Helper: Map Prisma result to HousingAdDetail
 */
function mapToHousingAdDetail(ad: any): HousingAdDetail {
  return {
    id: ad.id,
    userId: ad.userId,
    cityId: ad.cityId,
    cityName: ad.city.name,
    category: ad.category,
    status: ad.status,
    expirationDate: ad.expirationDate,
    viewsCount: ad.viewsCount,
    contactClicksCount: ad.contactClicksCount,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt,
    housing: {
      rentalKind: ad.housing.rentalKind,
      unitType: ad.housing.unitType,
      propertyType: ad.housing.propertyType,
      availabilityStartDate: ad.housing.availabilityStartDate,
      availabilityEndDate: ad.housing.availabilityEndDate,
      contractType: ad.housing.contractType,
      residenzaAvailable: ad.housing.residenzaAvailable,
      priceType: ad.housing.priceType,
      priceAmount: fromDecimal(ad.housing.priceAmount),
      priceNegotiable: ad.housing.priceNegotiable,
      depositAmount: fromDecimal(ad.housing.depositAmount),
      agencyFeeAmount: fromDecimal(ad.housing.agencyFeeAmount),
      billsPolicy: ad.housing.billsPolicy,
      billsMonthlyEstimate: fromDecimal(ad.housing.billsMonthlyEstimate),
      billsNotes: ad.housing.billsNotes,
      furnished: ad.housing.furnished,
      floorNumber: ad.housing.floorNumber,
      hasElevator: ad.housing.hasElevator,
      privateBathroom: ad.housing.privateBathroom,
      kitchenEquipped: ad.housing.kitchenEquipped,
      wifi: ad.housing.wifi,
      washingMachine: ad.housing.washingMachine,
      dishwasher: ad.housing.dishwasher,
      balcony: ad.housing.balcony,
      heatingType: ad.housing.heatingType,
      doubleGlazedWindows: ad.housing.doubleGlazedWindows,
      airConditioning: ad.housing.airConditioning,
      numberOfBathrooms: ad.housing.numberOfBathrooms,
      newlyRenovated: ad.housing.newlyRenovated,
      clothesDryer: ad.housing.clothesDryer,
      householdSize: ad.housing.householdSize,
      householdGender: ad.housing.householdGender,
      genderPreference: ad.housing.genderPreference,
      householdDescription: ad.housing.householdDescription,
      neighborhood: ad.housing.neighborhood,
      streetHint: ad.housing.streetHint,
      lat: fromDecimal(ad.housing.lat),
      lng: fromDecimal(ad.housing.lng),
      transitLines: ad.housing.transitLines,
      shopsNearby: ad.housing.shopsNearby,
      notes: ad.housing.notes,
    },
    mediaAssets: ad.mediaAssets.map((m: any) => ({
      id: m.id,
      storageKey: m.storageKey,
      mimeType: m.mimeType,
      alt: m.alt,
      order: m.order,
      width: m.width,
      height: m.height,
      bytes: m.bytes,
    })),
    coverMediaId: ad.coverMediaId,
    mediaCount: ad.mediaCount,
    user: {
      id: ad.user.id,
      name: ad.user.name,
      image: ad.user.image,
      verified: ad.user.verified,
      telegramHandle: ad.user.telegramHandle,
    },
  };
}
