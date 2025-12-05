'use client';

import { HousingAdCard } from '@/components/ad-cards/housing-ad-card';
import { MarketplaceAdCard } from '@/components/ad-cards/marketplace-ad-card';
import { ServiceAdCard } from '@/components/ad-cards/service-ad-card';
import { TransportationAdCard } from '@/components/ad-cards/transportation-ad-card';
import type { AdCardVariant } from '@/components/ad-cards/types';
import type { AdWithDetails } from '@/data/ads/ads';
import type { AdCategory } from '@/generated/prisma';
import type { JSX } from 'react';

export type AdCardRenderer = (options: {
  ad: AdWithDetails;
  variant?: AdCardVariant;
}) => JSX.Element | null;

type AdWithCategory<C extends AdCategory> = Extract<AdWithDetails, { category: C }>;

type CategoryComponent<C extends AdCategory> = (props: {
  ad: AdWithCategory<C>;
  variant?: AdCardVariant;
}) => JSX.Element;

const createRenderer = <C extends AdCategory>(
  category: C,
  Component: CategoryComponent<C>
): AdCardRenderer => {
  return ({ ad, variant }) => {
    if (ad.category !== category) {
      return null;
    }

    return <Component ad={ad as AdWithCategory<C>} variant={variant} />;
  };
};

export const AD_CARD_COMPONENTS: Record<AdCategory, AdCardRenderer | null> = {
  HOUSING: createRenderer('HOUSING', HousingAdCard),
  TRANSPORTATION: createRenderer('TRANSPORTATION', TransportationAdCard),
  MARKETPLACE: createRenderer('MARKETPLACE', MarketplaceAdCard),
  SERVICES: createRenderer('SERVICES', ServiceAdCard),
  CURRENCY: () => null,
};
