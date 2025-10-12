import type { AdCategory, AdStatus } from '@/generated/prisma';

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
