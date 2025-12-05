'use client';

import { OptimizedImage } from '@/components/optimized-image';
import { Card, CardContent } from '@/components/ui/card';
import {
  BathroomsIcon,
  COMFORT_AMENITIES_CHIPS,
  CORE_FEATURES_CHIPS,
  FloorIcon,
  HeatingIcon,
} from '@/constants/housing-features-config';
import { useCityById } from '@/contexts/cities-context';
import type { AdWithHousing } from '@/data/ads/ads';
import { cn, formatDate } from '@/lib/utils';
import { ArrowRight, ChevronRight, Eye, MapPin, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { FaCalendar } from 'react-icons/fa';
import { FaClock, FaHouse, FaPeoplePulling, FaPeopleRoof } from 'react-icons/fa6';
import { Separator } from '../ui/separator';
import { DEFAULT_AD_CARD_VARIANT, type AdCardVariant } from './types';
interface HousingAdCardProps {
  ad: AdWithHousing;
  variant?: AdCardVariant;
}

const CARD_VARIANT_CLASSES: Record<AdCardVariant, string> = {
  manage: 'border-0 shadow-sm',
  public: 'border border-muted/50 hover:border-primary/30 transition-colors',
  moderator: 'border border-destructive/30 bg-destructive/5 backdrop-blur-sm',
};

export function HousingAdCard({ ad, variant = DEFAULT_AD_CARD_VARIANT }: HousingAdCardProps) {
  const { housing, coverMedia, cityId, createdAt, viewsCount, contactClicksCount, expirationDate } =
    ad;
  const city = useCityById(cityId);
  const isTemporary = housing.rentalKind === 'TEMPORARY';
  const isPermanent = housing.rentalKind === 'PERMANENT';
  const priceNegotiable = housing.priceNegotiable || !housing.priceAmount;

  const formatPrice = () => {
    if (priceNegotiable) return '';
    const price = Number(housing.priceAmount);
    return `€${price}`;
  };

  const formatEnumLabel = (value: string): string => {
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getBillsPolicyColor = (policy?: string | null) => {
    switch (policy) {
      case 'INCLUDED':
        return 'bg-emerald-100';
      case 'EXCLUDED':
        return 'bg-amber-100';
      case 'PARTIAL':
        return 'bg-sky-100';
      default:
        return 'bg-gray-300';
    }
  };

  const detailMetrics = [
    {
      label: 'Floor',
      value: housing.floorNumber ?? '—',
      icon: FloorIcon,
    },

    {
      label: 'Bathrooms',
      value: housing.numberOfBathrooms ?? '—',
      icon: BathroomsIcon,
    },
    {
      label: 'Heat',
      value: housing.heatingType ? formatEnumLabel(housing.heatingType) : '—',
      icon: HeatingIcon,
    },
  ];

  const coreFeatureChips = CORE_FEATURES_CHIPS.filter((feature) => {
    const value = housing[feature.fieldName as keyof typeof housing];
    return value === true;
  }).map((feature) => ({
    label: feature.label,
    icon: feature.icon,
  }));

  const comfortFeatureChips = COMFORT_AMENITIES_CHIPS.filter((feature) => {
    const value = housing[feature.fieldName as keyof typeof housing];
    return value === true;
  }).map((feature) => ({
    label: feature.label,
    icon: feature.icon,
  }));

  const showBillsInfo =
    isPermanent && !housing.priceNegotiable && housing.priceAmount && Boolean(housing.billsPolicy);

  const cardVariantClasses = CARD_VARIANT_CLASSES[variant] ?? CARD_VARIANT_CLASSES.manage;

  return (
    <Link
      href={`/dashboard/ads-management/${ad.id}`}
      className="block group"
      data-variant={variant}
    >
      <Card
        className={cn(
          'py-0 transition-all duration-300 rounded-none md:rounded-3xl cursor-pointer overflow-hidden',
          cardVariantClasses
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Cover Image */}
            <div className="flex-1 w-full overflow-hidden">
              {coverMedia ? (
                <OptimizedImage
                  storageKey={coverMedia.storageKey}
                  imageType="gallery"
                  alt={coverMedia.alt || 'Housing ad image'}
                  className="w-full h-40 md:h-full object-cover "
                  fallbackIcon={<FaHouse className="w-12 h-12 text-gray-400" />}
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <FaHouse className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-4 md:flex-2 flex flex-col px-5 pt-5 pb-3">
              {/* Header Section */}
              <div className="space-y-1 mb-4">
                <h3 className="font-semibold text-xl text-gray-900 line-clamp-1">
                  {formatEnumLabel(housing.unitType)} · {formatEnumLabel(housing.propertyType)}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{city?.name || 'Unknown city'}</span>
                  {housing.neighborhood && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm">{housing.neighborhood}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-4 ">
                {/* Availability */}
                <div className="rounded-2xl border border-gray-100 bg-card shadow-xs ">
                  <div
                    className={cn(
                      'h-6 rounded-t-2xl bg-green-300 text-sm flex items-center px-6 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.2)]',
                      isTemporary
                        ? 'bg-gradient-to-r from-blue-500/90 to-blue-400/90 text-white'
                        : 'bg-gradient-to-r from-emerald-500/90 to-emerald-400/80 text-white'
                    )}
                  >
                    {isTemporary ? (
                      <span className="flex items-center gap-1.5">
                        <FaClock className="w-3 h-3" />
                        Temporary
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <FaHouse className="w-3 h-3" />
                        Permanent
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    {isPermanent && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center  text-emerald-500">
                          <FaCalendar className="w-6 h-6" />
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Available from
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDate(housing.availabilityStartDate)}
                            </p>
                          </div>
                          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                            {formatEnumLabel(housing.contractType)}
                          </span>
                        </div>
                      </div>
                    )}

                    {isTemporary && housing.availabilityEndDate && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center  text-blue-500">
                          <FaCalendar className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Availability
                          </p>
                          <div className=" flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>{formatDate(housing.availabilityStartDate)}</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(housing.availabilityEndDate)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Household */}
                <div className="inset-shadow-sm rounded-3xl bg-gray-50/80 px-5 py-4 space-y-3">
                  <div className=" text-[11px] uppercase text-gray-400 items-center">
                    Household
                    <Separator />
                  </div>

                  <div className="px-2 grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <FaPeopleRoof className="h-4 w-4 text-gray-600" />
                      <span className="text-[10px] uppercase tracking-wider text-gray-600">
                        Size (in total)
                      </span>
                      <span className="font-semibold text-gray-900">
                        {housing.householdSize || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaPeoplePulling className="h-4 w-4 text-gray-600" />
                      <span className="text-[10px] uppercase tracking-wider text-gray-600">
                        Preference
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatEnumLabel(housing.genderPreference)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 text-[11px] uppercase text-gray-400 items-center">
                    Features
                    <Separator />
                  </div>
                  {/* Features */}
                  <div className="px-2 grid grid-cols-2 gap-2 text-xs">
                    {detailMetrics.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">
                          {label}
                        </span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Feature chips */}
                  {(coreFeatureChips.length > 0 || comfortFeatureChips.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 border p-2 -mx-2 rounded-lg mt-4">
                      {coreFeatureChips.map(({ label, icon }) => (
                        <span
                          key={`core-${label}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {icon}
                          {label}
                        </span>
                      ))}
                      {comfortFeatureChips.map(({ label, icon }) => (
                        <span
                          key={`comfort-${label}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {icon}
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Section */}
              <div className="mt-auto  border-gray-100 flex flex-col justify-between">
                <div className="flex ml-auto gap-3 ">
                  {showBillsInfo && (
                    <div className="flex flex-col my-auto text-xs border-r border-gray-200 pr-2 text-gray-600">
                      <span className="font-medium text-[10px] ml-0.5 text-gray-900 uppercase">
                        Bills
                      </span>
                      <span
                        className={cn(
                          'font-semibold text-gray-900 px-1 py-0.5 rounded-[4px] ',
                          getBillsPolicyColor(housing.billsPolicy)
                        )}
                      >
                        {formatEnumLabel(housing.billsPolicy ?? '-')}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="flex justify-center items-center text-right">
                      {priceNegotiable ? (
                        <span className="text-md md:text-xl font-semibold text-center text-gray-900">
                          Price on request
                        </span>
                      ) : (
                        <span className="text-xl md:text-2xl font-semibold text-gray-900">
                          {formatPrice()}
                        </span>
                      )}
                    </p>
                    {!housing.priceNegotiable && housing.priceAmount && (
                      <p className=" text-[10px] md:text-xs text-gray-500 text-right">
                        {housing.priceType === 'MONTHLY' ? 'per month' : 'per night'}
                      </p>
                    )}
                  </div>
                  <div>
                    <ChevronRight className="size-6 sm:3 my-auto h-full text-gray-300" />
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {viewsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    {contactClicksCount}
                  </span>
                  <span>{formatDate(createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
