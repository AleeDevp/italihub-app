import type { AdCategory } from '@/generated/prisma';
import type { IconType } from 'react-icons';
import { BiSolidPlaneAlt } from 'react-icons/bi';
import { FaHouseChimney } from 'react-icons/fa6';
import { HiShoppingBag } from 'react-icons/hi2';
import { LuHandPlatter } from 'react-icons/lu';

export type AdCategoryMeta = {
  id: AdCategory;
  name: string;
  imageSrc: string;
  icon: IconType;
  cardTitle: string;
  cardDescription: string;
  guidelinesTitle: string;
  guidelines: string[];
  bgPrimaryColor: string;
  bgSecondaryColor: string;
};

export const AD_CATEGORY_CONFIG: readonly AdCategoryMeta[] = [
  {
    id: 'HOUSING',
    name: 'Housing',
    imageSrc: '/ads/housing.png',
    icon: FaHouseChimney,
    cardTitle: 'Housing Advertisement',
    cardDescription: 'Post your property listing for rent or sale',
    guidelinesTitle: 'Before you create a housing ad',
    guidelines: [
      'Only post properties you own or have permission to list.',
      'Provide accurate details about price, location, and condition.',
      'Photos must be clear and not contain watermarks or sensitive info.',
      'Avoid duplicate listings or misleading information.',
    ],
    bgPrimaryColor: 'ad-housing-bg-primary',
    bgSecondaryColor: 'ad-housing-bg-secondary',
  },
  {
    id: 'TRANSPORTATION',
    name: 'Transportation',
    imageSrc: '/ads/transportation.png',
    icon: BiSolidPlaneAlt,
    cardTitle: 'Transportation Advertisement',
    cardDescription: 'List your vehicle for sale or service',
    guidelinesTitle: 'Before you create a transportation ad',
    guidelines: [
      'Ensure the vehicle details are accurate and verifiable.',
      'Disclose any defects or known issues honestly.',
      'Use clear photos; avoid watermarks or sensitive information.',
      'No duplicate or misleading listings.',
    ],
    bgPrimaryColor: 'ad-transportation-bg-primary',
    bgSecondaryColor: 'ad-transportation-bg-secondary',
  },
  {
    id: 'MARKETPLACE',
    name: 'Market',
    imageSrc: '/ads/market.png',
    icon: HiShoppingBag,
    cardTitle: 'Market Advertisement',
    cardDescription: 'Sell your items or products on the marketplace',
    guidelinesTitle: 'Before you create a market ad',
    guidelines: [
      'Ensure product descriptions and prices are accurate.',
      'Use clear, honest photos without watermarks.',
      'Specify condition and shipping/collection details.',
      'No counterfeit or prohibited goods.',
    ],
    bgPrimaryColor: 'ad-marketplace-bg-primary',
    bgSecondaryColor: 'ad-marketplace-bg-secondary',
  },
  {
    id: 'SERVICES',
    name: 'Services',
    imageSrc: '/ads/services.png',
    icon: LuHandPlatter,
    cardTitle: 'Services Advertisement',
    cardDescription: 'Offer your professional services to the community',
    guidelinesTitle: 'Before you create a services ad',
    guidelines: [
      'Describe your service clearly and professionally.',
      'Be transparent about pricing and scope.',
      'Use clear images if applicable, no watermarks.',
      'No misleading claims or duplicate postings.',
    ],
    bgPrimaryColor: 'ad-services-bg-primary',
    bgSecondaryColor: 'ad-services-bg-secondary',
  },
] as const satisfies readonly AdCategoryMeta[];

export const AD_CATEGORY_BY_ID: Partial<Record<AdCategory, AdCategoryMeta>> =
  AD_CATEGORY_CONFIG.reduce(
    (acc, category) => {
      acc[category.id] = category;
      return acc;
    },
    {} as Partial<Record<AdCategory, AdCategoryMeta>>
  );

export const DEFAULT_AD_CATEGORY: AdCategory =
  (AD_CATEGORY_CONFIG[0]?.id as AdCategory | undefined) ?? 'HOUSING';
