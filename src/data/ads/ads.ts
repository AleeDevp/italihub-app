import type { AdCategory, AdStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db';

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

export async function getAdForOwner(adId: number, userId: string) {
  const ad = await prisma.ad.findFirst({
    where: { id: adId, userId },
    include: {
      city: true,
      marketplace: true,
      service: true,
      housing: true,
      transportation: true,
      exchange: true,
      mediaAssets: true,
    },
  });

  if (!ad) {
    throw new Error('Ad not found or access denied');
  }

  // Get the appropriate child based on category
  let child: any = null;
  switch (ad.category) {
    case 'MARKETPLACE':
      child = ad.marketplace;
      break;
    case 'SERVICES':
      child = ad.service;
      break;
    case 'HOUSING':
      child = ad.housing;
      break;
    case 'TRANSPORTATION':
      child = ad.transportation;
      break;
    case 'CURRENCY':
      child = ad.exchange;
      break;
  }

  return { ad, child };
}

export async function deleteAd(adId: number, userId: string): Promise<void> {
  // Verify ownership first
  const ad = await prisma.ad.findFirst({
    where: { id: adId, userId },
    select: { id: true },
  });

  if (!ad) {
    throw new Error('Ad not found or access denied');
  }

  // Delete the ad (cascade will handle child tables and media)
  await prisma.ad.delete({
    where: { id: adId },
  });
}

// TODO: Implement edit/renew functions based on specific ad types
// These would be implemented when we have the full ad creation/editing forms
export async function editAdMarketplace(params: any): Promise<void> {
  throw new Error('Not implemented yet');
}

export async function editAdService(params: any): Promise<void> {
  throw new Error('Not implemented yet');
}

export async function renewAdHousing(params: any): Promise<void> {
  throw new Error('Not implemented yet');
}

export async function renewAdTransportation(params: any): Promise<void> {
  throw new Error('Not implemented yet');
}
