'use client';

import { HousingAdDetails } from '@/components/ad-details/housing-ad-details';
import { MarketplaceAdDetails } from '@/components/ad-details/marketplace-ad-details';
import { ServiceAdDetails } from '@/components/ad-details/service-ad-details';
import { TransportationAdDetails } from '@/components/ad-details/transportation-ad-details';
import type { AdDetailVariant } from '@/components/ad-details/types';
import type { AdWithDetails } from '@/data/ads/ads';
import type { AdCategory } from '@/generated/prisma';
import type { JSX } from 'react';

export type AdDetailRenderer = (options: {
  ad: AdWithDetails;
  variant?: AdDetailVariant;
  ownerTelegramHandle?: string | null;
  showContactButton?: boolean;
  showEditButton?: boolean;
}) => JSX.Element | null;

type AdWithCategory<C extends AdCategory> = Extract<AdWithDetails, { category: C }>;

type CategoryComponent<C extends AdCategory> = (props: {
  ad: AdWithCategory<C>;
  variant?: AdDetailVariant;
  ownerTelegramHandle?: string | null;
  showContactButton?: boolean;
  showEditButton?: boolean;
}) => JSX.Element;

const createRenderer = <C extends AdCategory>(
  category: C,
  Component: CategoryComponent<C>
): AdDetailRenderer => {
  return ({ ad, variant, ownerTelegramHandle, showContactButton, showEditButton }) => {
    if (ad.category !== category) {
      return null;
    }

    return (
      <Component
        ad={ad as AdWithCategory<C>}
        variant={variant}
        ownerTelegramHandle={ownerTelegramHandle}
        showContactButton={showContactButton}
        showEditButton={showEditButton}
      />
    );
  };
};

export const AD_DETAIL_COMPONENTS: Record<AdCategory, AdDetailRenderer | null> = {
  HOUSING: createRenderer('HOUSING', HousingAdDetails),
  TRANSPORTATION: createRenderer('TRANSPORTATION', TransportationAdDetails),
  MARKETPLACE: createRenderer('MARKETPLACE', MarketplaceAdDetails),
  SERVICES: createRenderer('SERVICES', ServiceAdDetails),
  CURRENCY: () => null,
};
