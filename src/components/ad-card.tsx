'use client';

import { AD_CARD_COMPONENTS } from '@/constants/ad-card-components';
import type { AdWithDetails } from '@/data/ads/ads';
import type { AdCardVariant } from './ad-cards/types';

interface AdCardProps {
  ad: AdWithDetails;
  variant?: AdCardVariant;
}

export function AdCard({ ad, variant = 'manage' }: AdCardProps) {
  const renderer = AD_CARD_COMPONENTS[ad.category];

  if (!renderer) {
    return null;
  }

  return renderer({ ad, variant });
}
