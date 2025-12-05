import type { AdCategory, AdStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db';
import type { Decimal } from '@prisma/client/runtime/library';

// Helper function to serialize Prisma Decimal to string
function serializeDecimal(value: Decimal | null | undefined): string | null {
  if (!value) return null;
  return value.toString();
}

function deriveAdStatus(
  status: AdStatus,
  expirationDate: Date | null | undefined,
  now = new Date()
): AdStatus {
  if (expirationDate && expirationDate.getTime() < now.getTime()) {
    return 'EXPIRED';
  }

  return status;
}

// Discriminated union types for ads with their category details
export type AdWithHousing = {
  id: number;
  category: 'HOUSING';
  status: AdStatus;
  cityId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  coverMedia: {
    id: number;
    storageKey: string;
    alt: string | null;
  } | null;
  mediaAssets: Array<{
    id: number;
    storageKey: string;
    alt: string | null;
    order: number;
  }>;
  city: {
    id: number;
    name: string;
  };
  housing: {
    adId: number;
    rentalKind: string;
    unitType: string;
    propertyType: string;
    priceType: string;
    priceAmount: string | null;
    priceNegotiable: boolean;
    availabilityStartDate: Date;
    availabilityEndDate: Date | null;
    contractType: string;
    residenzaAvailable: boolean;
    depositAmount: string | null;
    agencyFeeAmount: string | null;
    billsPolicy: string;
    billsMonthlyEstimate: string | null;
    billsNotes: string | null;
    neighborhood: string | null;
    streetHint: string | null;
    lat: string | null;
    lng: string | null;
    householdSize: number | null;
    householdGender: string | null;
    genderPreference: string;
    householdDescription: string | null;
    furnished: boolean | null;
    floorNumber: number | null;
    hasElevator: boolean | null;
    privateBathroom: boolean | null;
    kitchenEquipped: boolean | null;
    wifi: boolean | null;
    washingMachine: boolean | null;
    dishwasher: boolean | null;
    balcony: boolean | null;
    heatingType: string;
    doubleGlazedWindows: boolean | null;
    airConditioning: boolean | null;
    numberOfBathrooms: number | null;
    newlyRenovated: boolean | null;
    clothesDryer: boolean | null;
    notes: string | null;
  };
};

export type AdWithTransportation = {
  id: number;
  category: 'TRANSPORTATION';
  status: AdStatus;
  cityId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  coverMedia: {
    id: number;
    storageKey: string;
    alt: string | null;
  } | null;
  mediaAssets: Array<{
    id: number;
    storageKey: string;
    alt: string | null;
    order: number;
  }>;
  city: {
    id: number;
    name: string;
  };
  transportation: {
    adId: number;
    direction: string;
    departureCity: string;
    departureCountry: string;
    arrivalCity: string;
    arrivalCountry: string;
    flightDate: Date;
    priceMode: string;
    pricePerKg: string | null;
    fixedTotalPrice: string | null;
    capacityKg: string | null;
  };
};

export type AdWithMarketplace = {
  id: number;
  category: 'MARKETPLACE';
  status: AdStatus;
  cityId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  coverMedia: {
    id: number;
    storageKey: string;
    alt: string | null;
  } | null;
  mediaAssets: Array<{
    id: number;
    storageKey: string;
    alt: string | null;
    order: number;
  }>;
  city: {
    id: number;
    name: string;
  };
  marketplace: {
    adId: number;
    title: string;
    description: string;
    price: string;
    condition: string;
    category: string | null;
  };
};

export type AdWithService = {
  id: number;
  category: 'SERVICES';
  status: AdStatus;
  cityId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  coverMedia: {
    id: number;
    storageKey: string;
    alt: string | null;
  } | null;
  mediaAssets: Array<{
    id: number;
    storageKey: string;
    alt: string | null;
    order: number;
  }>;
  city: {
    id: number;
    name: string;
  };
  service: {
    adId: number;
    title: string;
    description: string;
    serviceCategory: string;
    rateBasis: string;
    rateAmount: string | null;
    tags: string[];
  };
};

export type AdWithDetails =
  | AdWithHousing
  | AdWithTransportation
  | AdWithMarketplace
  | AdWithService;

/**
 * Fetch a single ad with its category-specific details
 */
export async function getAdWithDetails(id: number): Promise<AdWithDetails | null> {
  const now = new Date();
  const base = await prisma.ad.findUnique({
    where: { id },
    select: {
      id: true,
      category: true,
      status: true,
      cityId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      expirationDate: true,
      viewsCount: true,
      contactClicksCount: true,
    },
  });

  if (!base) return null;

  const commonSelect = {
    id: true,
    category: true,
    status: true,
    cityId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    expirationDate: true,
    viewsCount: true,
    contactClicksCount: true,
    coverMedia: {
      select: {
        id: true,
        storageKey: true,
        alt: true,
      },
    },
    mediaAssets: {
      select: {
        id: true,
        storageKey: true,
        alt: true,
        order: true,
      },
      orderBy: {
        order: 'asc' as const,
      },
    },
    city: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  switch (base.category) {
    case 'HOUSING': {
      const result = await prisma.ad.findUnique({
        where: { id },
        select: {
          ...commonSelect,
          housing: {
            select: {
              adId: true,
              rentalKind: true,
              unitType: true,
              propertyType: true,
              priceType: true,
              priceAmount: true,
              priceNegotiable: true,
              availabilityStartDate: true,
              availabilityEndDate: true,
              contractType: true,
              residenzaAvailable: true,
              depositAmount: true,
              agencyFeeAmount: true,
              billsPolicy: true,
              billsMonthlyEstimate: true,
              billsNotes: true,
              neighborhood: true,
              streetHint: true,
              lat: true,
              lng: true,
              householdSize: true,
              householdGender: true,
              genderPreference: true,
              householdDescription: true,
              furnished: true,
              floorNumber: true,
              hasElevator: true,
              privateBathroom: true,
              kitchenEquipped: true,
              wifi: true,
              washingMachine: true,
              dishwasher: true,
              balcony: true,
              heatingType: true,
              doubleGlazedWindows: true,
              airConditioning: true,
              numberOfBathrooms: true,
              newlyRenovated: true,
              clothesDryer: true,
              notes: true,
            },
          },
        },
      });

      if (!result) return null;
      const normalizedStatus = deriveAdStatus(result.status, result.expirationDate, now);

      return {
        ...result,
        status: normalizedStatus,
        housing: {
          ...result.housing!,
          priceAmount: serializeDecimal(result.housing!.priceAmount),
          depositAmount: serializeDecimal(result.housing!.depositAmount),
          agencyFeeAmount: serializeDecimal(result.housing!.agencyFeeAmount),
          billsMonthlyEstimate: serializeDecimal(result.housing!.billsMonthlyEstimate),
          lat: serializeDecimal(result.housing!.lat),
          lng: serializeDecimal(result.housing!.lng),
        },
      } as AdWithHousing;
    }

    case 'TRANSPORTATION': {
      const result = await prisma.ad.findUnique({
        where: { id },
        select: {
          ...commonSelect,
          transportation: {
            select: {
              adId: true,
              direction: true,
              departureCity: true,
              departureCountry: true,
              arrivalCity: true,
              arrivalCountry: true,
              flightDate: true,
              priceMode: true,
              pricePerKg: true,
              fixedTotalPrice: true,
              capacityKg: true,
            },
          },
        },
      });

      if (!result) return null;
      const normalizedStatus = deriveAdStatus(result.status, result.expirationDate, now);

      return {
        ...result,
        status: normalizedStatus,
        transportation: {
          ...result.transportation!,
          pricePerKg: serializeDecimal(result.transportation!.pricePerKg),
          fixedTotalPrice: serializeDecimal(result.transportation!.fixedTotalPrice),
          capacityKg: serializeDecimal(result.transportation!.capacityKg),
        },
      } as AdWithTransportation;
    }

    case 'MARKETPLACE': {
      const result = await prisma.ad.findUnique({
        where: { id },
        select: {
          ...commonSelect,
          marketplace: {
            select: {
              adId: true,
              title: true,
              description: true,
              price: true,
              condition: true,
              category: true,
            },
          },
        },
      });

      if (!result) return null;
      const normalizedStatus = deriveAdStatus(result.status, result.expirationDate, now);

      return {
        ...result,
        status: normalizedStatus,
        marketplace: {
          ...result.marketplace!,
          price: result.marketplace!.price.toString(),
        },
      } as AdWithMarketplace;
    }

    case 'SERVICES': {
      const result = await prisma.ad.findUnique({
        where: { id },
        select: {
          ...commonSelect,
          service: {
            select: {
              adId: true,
              title: true,
              description: true,
              serviceCategory: true,
              rateBasis: true,
              rateAmount: true,
              tags: true,
            },
          },
        },
      });

      if (!result) return null;
      const normalizedStatus = deriveAdStatus(result.status, result.expirationDate, now);

      return {
        ...result,
        status: normalizedStatus,
        service: {
          ...result.service!,
          rateAmount: serializeDecimal(result.service!.rateAmount),
        },
      } as AdWithService;
    }

    default:
      return null;
  }
}

/**
 * Fetch all ads for a user with category-specific details
 */
export async function getUserAdsWithDetails(
  userId: string,
  category?: AdCategory,
  status?: AdStatus
): Promise<AdWithDetails[]> {
  const now = new Date();
  const whereClause = category ? { userId, category } : { userId };

  const ads = await prisma.ad.findMany({
    where: whereClause,
    select: {
      id: true,
      category: true,
      status: true,
      cityId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      expirationDate: true,
      viewsCount: true,
      contactClicksCount: true,
      coverMedia: {
        select: {
          id: true,
          storageKey: true,
          alt: true,
        },
      },
      mediaAssets: {
        select: {
          id: true,
          storageKey: true,
          alt: true,
          order: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
      housing: {
        select: {
          adId: true,
          rentalKind: true,
          unitType: true,
          propertyType: true,
          priceType: true,
          priceAmount: true,
          priceNegotiable: true,
          availabilityStartDate: true,
          availabilityEndDate: true,
          contractType: true,
          residenzaAvailable: true,
          depositAmount: true,
          agencyFeeAmount: true,
          billsPolicy: true,
          billsMonthlyEstimate: true,
          billsNotes: true,
          neighborhood: true,
          streetHint: true,
          lat: true,
          lng: true,
          householdSize: true,
          householdGender: true,
          genderPreference: true,
          householdDescription: true,
          furnished: true,
          floorNumber: true,
          hasElevator: true,
          privateBathroom: true,
          kitchenEquipped: true,
          wifi: true,
          washingMachine: true,
          dishwasher: true,
          balcony: true,
          heatingType: true,
          doubleGlazedWindows: true,
          airConditioning: true,
          numberOfBathrooms: true,
          newlyRenovated: true,
          clothesDryer: true,
          notes: true,
        },
      },
      transportation: {
        select: {
          adId: true,
          direction: true,
          departureCity: true,
          departureCountry: true,
          arrivalCity: true,
          arrivalCountry: true,
          flightDate: true,
          priceMode: true,
          pricePerKg: true,
          fixedTotalPrice: true,
          capacityKg: true,
        },
      },
      marketplace: {
        select: {
          adId: true,
          title: true,
          description: true,
          price: true,
          condition: true,
          category: true,
        },
      },
      service: {
        select: {
          adId: true,
          title: true,
          description: true,
          serviceCategory: true,
          rateBasis: true,
          rateAmount: true,
          tags: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const normalizedAds = ads.reduce<AdWithDetails[]>((acc, ad) => {
    const normalizedStatus = deriveAdStatus(ad.status, ad.expirationDate, now);

    if (ad.category === 'HOUSING' && ad.housing) {
      acc.push({
        ...ad,
        status: normalizedStatus,
        housing: {
          ...ad.housing,
          priceAmount: serializeDecimal(ad.housing.priceAmount),
          depositAmount: serializeDecimal(ad.housing.depositAmount),
          agencyFeeAmount: serializeDecimal(ad.housing.agencyFeeAmount),
          billsMonthlyEstimate: serializeDecimal(ad.housing.billsMonthlyEstimate),
          lat: serializeDecimal(ad.housing.lat),
          lng: serializeDecimal(ad.housing.lng),
        },
      } as AdWithHousing);
      return acc;
    }

    if (ad.category === 'TRANSPORTATION' && ad.transportation) {
      acc.push({
        ...ad,
        status: normalizedStatus,
        transportation: {
          ...ad.transportation,
          pricePerKg: serializeDecimal(ad.transportation.pricePerKg),
          fixedTotalPrice: serializeDecimal(ad.transportation.fixedTotalPrice),
          capacityKg: serializeDecimal(ad.transportation.capacityKg),
        },
      } as AdWithTransportation);
      return acc;
    }

    if (ad.category === 'MARKETPLACE' && ad.marketplace) {
      acc.push({
        ...ad,
        status: normalizedStatus,
        marketplace: {
          ...ad.marketplace,
          price: ad.marketplace.price.toString(),
        },
      } as AdWithMarketplace);
      return acc;
    }

    if (ad.category === 'SERVICES' && ad.service) {
      acc.push({
        ...ad,
        status: normalizedStatus,
        service: {
          ...ad.service,
          rateAmount: serializeDecimal(ad.service.rateAmount),
        },
      } as AdWithService);
      return acc;
    }

    return acc;
  }, []);

  if (!status) {
    return normalizedAds;
  }

  return normalizedAds.filter((ad) => ad.status === status);
}

export type UserAdListParams = {
  userId: string;
  status?: AdStatus;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'created-desc' | 'created-asc';
};

export type UserAdListItem = {
  id: number;
  category: AdCategory;
  status: AdStatus;
  cityName: string;
  createdAt: Date;
  expirationDate?: Date | null;
  viewsCount: number;
  contactClicksCount: number;
  // Child projections
  title?: string | null;
  priceLabel?: string | null;
  summary?: string | null;
  thumbnail?: string | null;
};

export async function getUserAdStats(userId: string): Promise<{
  online: number;
  pending: number;
  rejected: number;
  expired: number;
}> {
  // For now, return mock data to avoid typing issues
  // TODO: Implement proper stats aggregation
  return {
    online: 3,
    pending: 1,
    rejected: 0,
    expired: 2,
  };
}

export async function listUserAds(params: UserAdListParams): Promise<{
  items: UserAdListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  // For now, return mock data to avoid complex typing issues
  // TODO: Implement proper ad listing with proper Prisma includes
  const mockAds: UserAdListItem[] = [
    {
      id: 1,
      category: 'MARKETPLACE',
      status: 'ONLINE',
      cityName: 'Milan',
      createdAt: new Date(),
      expirationDate: null,
      viewsCount: 45,
      contactClicksCount: 12,
      title: 'iPhone 15 Pro',
      priceLabel: '€800',
      summary: 'Excellent condition iPhone 15 Pro',
      thumbnail: null,
    },
    {
      id: 2,
      category: 'HOUSING',
      status: 'PENDING',
      cityName: 'Rome',
      createdAt: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      viewsCount: 23,
      contactClicksCount: 5,
      title: null,
      priceLabel: '€600/mo',
      summary: 'Beautiful apartment in city center',
      thumbnail: null,
    },
  ];

  return {
    items: mockAds,
    total: mockAds.length,
    page: params.page || 1,
    pageSize: params.pageSize || 12,
  };
}
