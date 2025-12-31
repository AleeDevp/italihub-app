'use client';

import { HousingDialog } from '@/components/ad-forms/housing/housing-dialog';
import { Button } from '@/components/ui/button';
import {
  BathroomsIcon,
  COMFORT_AMENITIES_CHIPS,
  CORE_FEATURES_CHIPS,
  FloorIcon,
  HeatingIcon,
} from '@/constants/housing-features-config';
import { HOUSING_STEP_CONFIG } from '@/constants/housing-step-config';
import type { AdWithHousing } from '@/data/ads/ads';
import { getOptimizedUrl } from '@/lib/image_system/image-utils-client';
import { cn, formatDate } from '@/lib/utils';
import {
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  LogIn,
  LogOut,
  MousePointerClick,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { FaBan, FaCalendar, FaFileContract, FaRoad } from 'react-icons/fa';
import { FaClock, FaLocationDot, FaPeoplePulling, FaPeopleRoof } from 'react-icons/fa6';
import { MdLocationCity, MdStickyNote2 } from 'react-icons/md';
import { RiTelegram2Fill } from 'react-icons/ri';
import { Separator } from '../ui/separator';
import { LocationMap } from './location-map';
import { DEFAULT_AD_DETAIL_VARIANT, type AdDetailVariant } from './types';

interface HousingAdDetailsProps {
  ad: AdWithHousing;
  variant?: AdDetailVariant;
  ownerTelegramHandle?: string | null;
  showContactButton?: boolean;
  showEditButton?: boolean;
}

const WRAPPER_VARIANT_CLASS: Record<AdDetailVariant, string> = {
  manage: 'space-y-4 max-w-6xl mx-auto',
  public: 'space-y-4 max-w-6xl mx-auto',
  moderator: 'space-y-4 max-w-6xl mx-auto bg-muted/20 p-6 rounded-3xl',
};

/**
 * Formats enum values to human-readable labels
 */
const formatEnumLabel = (value: string | null | undefined): string => {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Section component with consistent styling
 */
interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, children, className }) => (
  <div className={cn('space-y-4 bg-white rounded-3xl p-4 border', className)}>
    <div className="flex items-center gap-2.5 border-b pb-2">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
      <h3 className="text-md sm:text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="px-2">{children}</div>
  </div>
);

export function HousingAdDetails({
  ad,
  variant = DEFAULT_AD_DETAIL_VARIANT,
  ownerTelegramHandle,
  showContactButton = true,
  showEditButton = false,
}: HousingAdDetailsProps) {
  const housing = ad.housing;
  const isTemporary = housing.rentalKind === 'TEMPORARY';
  const isPermanent = housing.rentalKind === 'PERMANENT';
  const wrapperClass = WRAPPER_VARIANT_CLASS[variant] ?? WRAPPER_VARIANT_CLASS.manage;
  const priceNegotiable = housing.priceNegotiable || !housing.priceAmount;

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Get icons from step config
  const BasicsIcon = HOUSING_STEP_CONFIG[0].icon; // Step 1: Basics
  const AvailabilityIcon = HOUSING_STEP_CONFIG[1].icon; // Step 2: Availability
  const PriceIcon = HOUSING_STEP_CONFIG[2].icon; // Step 3: Price
  const FeaturesIcon = HOUSING_STEP_CONFIG[3].icon; // Step 4: Features
  const HouseholdIcon = HOUSING_STEP_CONFIG[4].icon; // Step 5: Household

  // Calculate duration for temporary rentals
  const calculateDuration = () => {
    if (!isTemporary || !housing.availabilityEndDate) return null;
    const start = new Date(housing.availabilityStartDate);
    const end = new Date(housing.availabilityEndDate);
    const nights = Math.max(
      0,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    return nights;
  };

  const duration = calculateDuration();

  // Pricing display helper
  const getPriceDisplay = () => {
    if (priceNegotiable) {
      return { main: 'Negotiable', sub: 'Price upon discussion' };
    }
    return {
      main: `€${Number(housing.priceAmount)}`,
      sub: isTemporary ? 'per night' : 'per month',
    };
  };

  const priceDisplay = getPriceDisplay();

  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const images = ad.mediaAssets || [];
  const hasImages = images.length > 0;

  // Precompute all image URLs once on mount to avoid refetching
  // Use ad.id as dependency to ensure URLs are computed only once per ad
  const imageUrls = useMemo(
    () => (ad.mediaAssets || []).map((img) => getOptimizedUrl(img.storageKey, 'gallery')),
    [ad.id]
  );

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setTouchStart(e.clientX);
    setTouchEnd(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStart) return;
    setTouchEnd(e.clientX);
    setDragOffset(e.clientX - touchStart);
  };

  const onMouseUp = () => {
    if (!isDragging || !touchStart || touchEnd === null) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }

    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
    setDragOffset(0);
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTouchStart(null);
      setTouchEnd(null);
      setDragOffset(0);
    }
  };

  return (
    <div
      className={cn(wrapperClass, 'bg-background pb-1 mb-4 md:rounded-3xl md:border md:shadow-sm')}
    >
      {/* Image Gallery */}
      {hasImages && (
        <div
          className="relative w-full h-[400px] md:h-[500px] md:rounded-3xl overflow-hidden mb-6 bg-gray-100 select-none"
          onTouchStart={images.length > 1 ? onTouchStart : undefined}
          onTouchMove={images.length > 1 ? onTouchMove : undefined}
          onTouchEnd={images.length > 1 ? onTouchEnd : undefined}
          onMouseDown={images.length > 1 ? onMouseDown : undefined}
          onMouseMove={images.length > 1 ? onMouseMove : undefined}
          onMouseUp={images.length > 1 ? onMouseUp : undefined}
          onMouseLeave={images.length > 1 ? onMouseLeave : undefined}
          style={{ cursor: images.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {/* Render all images but only show current one - prevents refetching */}
          {imageUrls.map((url, index) =>
            url ? (
              <img
                key={`ad-${ad.id}-img-${index}`}
                src={url}
                alt={images[index]?.alt || `Image ${index + 1}`}
                className={cn(
                  'absolute inset-0 w-full h-full object-cover transition-all duration-300',
                  index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                )}
                style={{
                  transform:
                    index === currentImageIndex && isDragging
                      ? `translateX(${dragOffset}px)`
                      : 'translateX(0)',
                  pointerEvents: 'none',
                }}
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            ) : null
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm z-20">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
      <div className="px-4 space-y-4 mb-12">
        {/* Header: Property Title & Location */}
        <div className="pl-3 space-y-2 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {formatEnumLabel(housing.unitType)} · {formatEnumLabel(housing.propertyType)}
            </h1>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full border font-semibold text-xs md:text-sm',
                isTemporary
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              )}
            >
              {isTemporary ? (
                <>
                  <FaClock className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Temporary</span>
                </>
              ) : (
                <>
                  <BasicsIcon className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Permanent</span>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-700">
            <FaLocationDot className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{ad.city.name}</span>
            {housing.neighborhood && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{housing.neighborhood}</span>
              </>
            )}
          </div>

          {/* Edit Button - Show in manage variant */}
          {showEditButton && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="gap-2 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit Ad
              </Button>
            </div>
          )}

          {/* stats and posted date */}
          <div className="mr-6 flex items-center justify-end gap-4 text-xs text-gray-500">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {ad.viewsCount}
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5" />
                {ad.contactClicksCount}
              </span>
            </div>
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(ad.createdAt)}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="relative grid md:grid-cols-3 gap-4 ">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-3">
            {/* Basics Section */}
            <Section title="Property Details" icon={BasicsIcon}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                    Property Type
                  </p>
                  <p className="text-sm   text-gray-900">{formatEnumLabel(housing.propertyType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                    Unit Type
                  </p>
                  <p className="text-sm  text-gray-900">{formatEnumLabel(housing.unitType)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                    Rental Kind
                  </p>
                  <p className="text-sm  text-gray-900">{formatEnumLabel(housing.rentalKind)}</p>
                </div>
              </div>
            </Section>

            {/* Availability Section */}
            <Section title="Availability" icon={AvailabilityIcon}>
              {/* Permanent Housing Layout */}
              {isPermanent && (
                <div className="bg-white rounded-3xl border border-gray-100 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                      <FaCalendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                        Available From
                      </p>
                      <p className="text-lg font-bold text-gray-900 truncate">
                        {formatDate(housing.availabilityStartDate)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 md:gap-2">
                      <div
                        className={cn(
                          'flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider border shrink-0',
                          housing.contractType === 'LONG_TERM' &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200',
                          housing.contractType === 'SHORT_TERM' &&
                            'bg-orange-50 text-orange-700 border-orange-200',
                          (!housing.contractType || housing.contractType === 'NONE') &&
                            'bg-red-50 text-red-700 border-red-200'
                        )}
                      >
                        {housing.contractType === 'LONG_TERM' && (
                          <FaFileContract className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        )}
                        {housing.contractType === 'SHORT_TERM' && (
                          <FaClock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        )}
                        {(!housing.contractType || housing.contractType === 'NONE') && (
                          <FaBan className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        )}
                        <span>
                          {housing.contractType === 'LONG_TERM'
                            ? 'Long Term'
                            : housing.contractType === 'SHORT_TERM'
                              ? 'Short Term'
                              : 'No Contract'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[10px] font-medium">
                        <span className="text-gray-400 uppercase tracking-wider">Residenza</span>
                        <span
                          className={cn(
                            'flex items-center ',
                            housing.residenzaAvailable ? 'text-emerald-600' : 'text-red-600'
                          )}
                        >
                          {housing.residenzaAvailable ? (
                            <span className="text-[8px] md:text-[9px]">✓</span>
                          ) : (
                            <span className="text-[8px] md:text-[9px]">✕</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Temporary Housing Layout */}
              {isTemporary && housing.availabilityEndDate && (
                <div className="space-y-4">
                  {/* Desktop View */}
                  <div className="hidden md:flex items-center justify-between gap-4 bg-white">
                    <div className="flex-1 flex items-center gap-3 rounded-3xl border border-gray-200 p-5">
                      <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                        <LogIn className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Check-in
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDate(housing.availabilityStartDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-4 ">
                      <span className="text-[12px] text-gray-400 ">{duration} Nights</span>
                      <div className="flex items-center text-gray-200">
                        <div className="h-[2px] w-12 bg-gray-200"></div>
                        <ChevronRight className="w-4 h-4 -ml-1 text-gray-300" />
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-3 rounded-3xl border border-gray-200 p-5">
                      <div className="p-2.5 bg-red-50 rounded-xl text-red-600 border border-red-100">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Check-out
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDate(housing.availabilityEndDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Check-in
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {formatDate(housing.availabilityStartDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <div className="h-px flex-1 bg-gray-100"></div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {duration} Nights Stay
                      </span>
                      <div className="h-px flex-1 bg-gray-100"></div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                      <div className="p-2 bg-red-50 rounded-lg text-red-600 border border-red-100">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Check-out
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {formatDate(housing.availabilityEndDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* Price Section - Mobile Only */}
            <div className="md:hidden space-y-4 bg-white rounded-3xl p-4 border">
              {/* Card Header */}
              <div className="flex items-center gap-2.5 border-b pb-2">
                <PriceIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <h3 className="text-md sm:text-lg font-semibold text-gray-900">Pricing Details</h3>
              </div>

              <div className="px-2 space-y-5">
                {/* Price Section - Hero Style */}
                <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-5 shadow-sm border border-emerald-100 overflow-hidden">
                  {/* Decorative elements */}
                  <Banknote className="absolute top-0 right-0 w-32 h-32 text-emerald-900/5 -rotate-12 -translate-y-8 translate-x-8" />
                  <Banknote className="absolute bottom-0 left-0 w-24 h-24 text-emerald-900/5 rotate-12 translate-y-8 -translate-x-8" />

                  <div className="relative flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <PriceIcon className="w-5 h-5 text-emerald-700" />
                      <span className="text-emerald-900 text-lg font-bold">Price</span>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-extrabold text-emerald-900 drop-shadow-sm">
                        {priceDisplay.main}
                      </span>
                      {!priceNegotiable && (
                        <p className="text-emerald-700 text-sm font-medium">{priceDisplay.sub}</p>
                      )}
                      {priceNegotiable && (
                        <p className="text-emerald-700 text-xs font-medium">{priceDisplay.sub}</p>
                      )}
                    </div>
                  </div>
                </div>

                {isPermanent && (
                  <div className="space-y-4">
                    {/* Contract Section */}
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm text-gray-600 font-medium">Contract</span>
                      <span
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-bold shadow-sm',
                          housing.contractType === 'LONG_TERM' &&
                            'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200',
                          housing.contractType === 'SHORT_TERM' &&
                            'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200',
                          (!housing.contractType || housing.contractType === 'NONE') &&
                            'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
                        )}
                      >
                        {housing.contractType === 'LONG_TERM'
                          ? '✓ Long Term'
                          : housing.contractType === 'SHORT_TERM'
                            ? 'Short Term'
                            : '✕ No contract'}
                      </span>
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* Deposit & Agency Fee Section */}
                    <div className="bg-gray-50/70 rounded-xl p-3 space-y-3 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-sm text-gray-600">Deposit</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {housing.depositAmount ? `€${Number(housing.depositAmount)}` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-sm text-gray-600">Agency Fee</span>
                        </div>
                        {housing.agencyFeeAmount ? (
                          <span className="text-sm font-semibold text-gray-900">
                            €{Number(housing.agencyFeeAmount)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            No fee
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bills Section */}
                    {housing.billsPolicy && (
                      <>
                        <Separator className="bg-gray-100" />
                        <div className="space-y-3 px-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Bills</span>
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-bold shadow-sm',
                                housing.billsPolicy === 'INCLUDED' &&
                                  'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200',
                                housing.billsPolicy === 'EXCLUDED' &&
                                  'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200',
                                housing.billsPolicy === 'PARTIAL' &&
                                  'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200'
                              )}
                            >
                              {housing.billsPolicy === 'INCLUDED' && '✓ '}
                              {housing.billsPolicy === 'EXCLUDED' && '✕ '}
                              {formatEnumLabel(housing.billsPolicy)}
                            </span>
                          </div>
                          {(housing.billsPolicy === 'EXCLUDED' ||
                            housing.billsPolicy === 'PARTIAL') &&
                            housing.billsMonthlyEstimate && (
                              <div className="flex justify-between items-center bg-gray-50/70 rounded-lg p-2 border border-gray-100">
                                <span className="text-xs text-gray-500">Est. Monthly</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  €{Number(housing.billsMonthlyEstimate)}
                                </span>
                              </div>
                            )}
                        </div>
                      </>
                    )}

                    {/* Bills Note */}
                    {housing.billsNotes && (
                      <>
                        <Separator className="bg-gray-100" />
                        <div className="px-1">
                          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                            Bills Note
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border">
                            {housing.billsNotes}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Household Section */}
            <Section title="Household" icon={HouseholdIcon}>
              <div className="space-y-4">
                <div className="flex flex-row items-center justify-between gap-2 pb-3 border-b">
                  <div className="flex items-center w-full gap-2 font-medium text-gray-700">
                    <FaPeopleRoof className="w-6 h-6 text-gray-500" />
                    <span className="flex flex-col text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                      Total People
                      <span className="text-gray-900 text-xs">{housing.householdSize || '—'}</span>
                    </span>
                  </div>
                  <div className="flex items-center w-full gap-2 font-medium text-gray-700">
                    <FaPeoplePulling className="w-6 h-6 text-gray-500" />
                    <span className="flex flex-col text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                      Looking For
                      <span className="text-gray-900 text-xs">
                        {formatEnumLabel(housing.genderPreference)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Household Description Note */}
                {housing.householdDescription && (
                  <div className="">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                      Note
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border">
                      {housing.householdDescription}
                    </p>
                  </div>
                )}
              </div>
            </Section>

            {/* Features Section */}
            <Section title="Features & Amenities" icon={FeaturesIcon}>
              <div className="space-y-4">
                {/* Property Details */}
                <div className="flex flex-row items-center justify-between gap-2 pb-3 border-b">
                  <div className="flex items-center w-full gap-2 font-medium text-gray-700">
                    <FloorIcon className="w-6 h-6 text-gray-500" />
                    <span className="flex flex-col text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                      Floor
                      <span className=" text-gray-900 text-xs">{housing.floorNumber ?? '—'}</span>
                    </span>
                  </div>
                  <div className="flex items-center w-full gap-2 font-medium text-gray-700">
                    <BathroomsIcon className="w-6 h-6 text-gray-500" />
                    <span className="flex flex-col text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                      Bathrooms
                      <span className=" text-gray-900 text-xs">
                        {housing.numberOfBathrooms ?? '—'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center w-full gap-2 font-medium text-gray-700">
                    <HeatingIcon className="w-6 h-6 text-gray-500" />
                    <span className="flex flex-col text-[10px] uppercase tracking-wide text-gray-500 font-medium">
                      Heating
                      <span className=" text-gray-900 text-xs">
                        {formatEnumLabel(housing.heatingType)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Core Features */}
                {CORE_FEATURES_CHIPS.filter((feature) => {
                  const value = housing[feature.fieldName as keyof typeof housing];
                  return value === true;
                }).length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
                      Core Features
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CORE_FEATURES_CHIPS.filter((feature) => {
                        const value = housing[feature.fieldName as keyof typeof housing];
                        return value === true;
                      }).map((feature) => (
                        <span
                          key={`core-${feature.fieldName}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                        >
                          {feature.icon}
                          {feature.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comfort & Appliances */}
                {COMFORT_AMENITIES_CHIPS.filter((feature) => {
                  const value = housing[feature.fieldName as keyof typeof housing];
                  return value === true;
                }).length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
                      Comfort & Appliances
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {COMFORT_AMENITIES_CHIPS.filter((feature) => {
                        const value = housing[feature.fieldName as keyof typeof housing];
                        return value === true;
                      }).map((feature) => (
                        <span
                          key={`comfort-${feature.fieldName}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                        >
                          {feature.icon}
                          {feature.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Notes Section */}
            {housing.notes && (
              <Section title="Note" icon={MdStickyNote2}>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border">
                  {housing.notes}
                </p>
              </Section>
            )}

            {/* Location Section */}
          </div>

          {/* Right Column: Pricing & Availability Card (Desktop: Sticky, Mobile: Hidden) */}
          <div className="hidden md:block md:col-span-1">
            <div className="sticky top-30 space-y-4">
              <div className="border bg-gradient-to-b from-white to-gray-50/50 rounded-3xl shadow-lg overflow-hidden">
                {/* Price Section - Hero Style */}
                <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6 border-b border-emerald-100 overflow-hidden">
                  {/* Decorative elements */}
                  <Banknote className="absolute top-0 right-0 w-32 h-32 text-emerald-900/5 -rotate-12 -translate-y-8 translate-x-8" />
                  <Banknote className="absolute bottom-0 left-0 w-24 h-24 text-emerald-900/5 rotate-12 translate-y-8 -translate-x-8" />

                  <div className="relative flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {/* <Banknote className="w-5 h-5 text-emerald-700" /> */}
                      <span className="text-emerald-900 text-lg font-bold">Rent</span>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-extrabold text-emerald-900 drop-shadow-sm">
                        {priceDisplay.main}
                      </span>
                      {!priceNegotiable && (
                        <p className="text-emerald-700 text-sm font-medium">{priceDisplay.sub}</p>
                      )}
                      {priceNegotiable && (
                        <p className="text-emerald-700 text-xs font-medium">{priceDisplay.sub}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {isPermanent && (
                    <div className="space-y-4">
                      {/* Deposit & Agency Fee Section */}
                      <div className="bg-gray-50/70 rounded-xl p-3 space-y-3 border border-gray-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-sm text-gray-600">Deposit</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {housing.depositAmount ? `€${Number(housing.depositAmount)}` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-sm text-gray-600">Agency Fee</span>
                          </div>
                          {housing.agencyFeeAmount ? (
                            <span className="text-sm font-semibold text-gray-900">
                              €{Number(housing.agencyFeeAmount)}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              No fee
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bills Section */}
                      {housing.billsPolicy && (
                        <>
                          <Separator className="bg-gray-200" />
                          <div className="space-y-3 px-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 font-medium">Bills</span>
                              <span
                                className={cn(
                                  ' text-xs pr-2',
                                  housing.billsPolicy === 'INCLUDED' && ' text-emerald-700 ',
                                  housing.billsPolicy === 'EXCLUDED' && ' text-red-700 ',
                                  housing.billsPolicy === 'PARTIAL' && ' text-amber-700 '
                                )}
                              >
                                {housing.billsPolicy === 'INCLUDED' && '✓ '}
                                {housing.billsPolicy === 'EXCLUDED' && '✕ '}
                                {formatEnumLabel(housing.billsPolicy)}
                              </span>
                            </div>
                            {(housing.billsPolicy === 'EXCLUDED' ||
                              housing.billsPolicy === 'PARTIAL') &&
                              housing.billsMonthlyEstimate && (
                                <div className="flex justify-between items-center bg-gray-50/70 rounded-lg p-2 border border-gray-100">
                                  <span className="text-xs text-gray-500">Est. Monthly</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    €{Number(housing.billsMonthlyEstimate)}
                                  </span>
                                </div>
                              )}
                          </div>
                          <Separator className="bg-gray-100" />
                        </>
                      )}
                    </div>
                  )}
                  <Separator className="bg-gray-200" />

                  {/* Availability Dates */}
                  <div className="space-y-2 px-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-100">
                          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {isTemporary ? 'Check-in' : 'Available'}
                        </span>
                      </div>
                      <span className="text-sm  text-gray-900">
                        {formatDate(housing.availabilityStartDate)}
                      </span>
                    </div>
                    {isTemporary && housing.availabilityEndDate && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-red-100">
                            <LogOut className="w-3.5 h-3.5 text-red-600" />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Check-out
                          </span>
                        </div>
                        <span className="text-sm  text-gray-900">
                          {formatDate(housing.availabilityEndDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {isPermanent ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide shrink-0">
                        Contract
                      </span>
                      <Separator className="flex-1 bg-gray-200" />
                      <div
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0',
                          housing.contractType === 'LONG_TERM' &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200',
                          housing.contractType === 'SHORT_TERM' &&
                            'bg-orange-50 text-orange-700 border-orange-200',
                          (!housing.contractType || housing.contractType === 'NONE') &&
                            'bg-red-50 text-red-700 border-red-200'
                        )}
                      >
                        {housing.contractType === 'LONG_TERM' && (
                          <FaFileContract className="w-2.5 h-2.5" />
                        )}
                        {housing.contractType === 'SHORT_TERM' && (
                          <FaClock className="w-2.5 h-2.5" />
                        )}
                        {(!housing.contractType || housing.contractType === 'NONE') && (
                          <FaBan className="w-2.5 h-2.5" />
                        )}
                        <span>
                          {housing.contractType === 'LONG_TERM'
                            ? 'Long Term'
                            : housing.contractType === 'SHORT_TERM'
                              ? 'Short Term'
                              : 'No Contract'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Separator className="bg-gray-200" />
                  )}

                  {/* Contact Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                    size="lg"
                    asChild
                  >
                    <a
                      href={`https://t.me/${ownerTelegramHandle || 'placeholder'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <RiTelegram2Fill className="w-5 h-5" />
                      <span className="font-semibold">Contact Owner</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {housing.lat && housing.lng && (
          <div className="relative w-full h-[350px] sm:h-[400px] rounded-3xl overflow-hidden">
            {/* Map - Full Width */}
            <LocationMap
              lat={parseFloat(housing.lat)}
              lng={parseFloat(housing.lng)}
              markerRadius={300}
            />

            {/* Location Details Overlay - Top */}
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="flex flex-row flex-wrap gap-2">
                {/* City */}
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200/50">
                  <FaLocationDot className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                      City
                    </span>
                    <span className="text-xs text-gray-900 font-medium">{ad.city.name}</span>
                  </span>
                </div>

                {/* Neighborhood */}
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200/50">
                  <MdLocationCity className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                      Neighborhood
                    </span>
                    <span className="text-xs text-gray-900 font-medium">
                      {housing.neighborhood || 'Not specified'}
                    </span>
                  </span>
                </div>

                {/* Street Hint */}
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200/50">
                  <FaRoad className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                      Street Hint
                    </span>
                    <span className="text-xs text-gray-900 font-medium">
                      {housing.streetHint || 'Not specified'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar - Sticky */}
      <div className="fixed bottom-12 left-0 right-0 md:hidden bg-white border-t shadow-lg z-50">
        <div className="px-4 py-4">
          <div className="w-full flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{priceDisplay.main}</span>
                {!priceNegotiable && (
                  <span className="text-gray-600 text-sm">{priceDisplay.sub}</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isTemporary ? '' : 'Available: '}
                {formatDate(housing.availabilityStartDate)}
                {housing.availabilityEndDate ? ` → ${formatDate(housing.availabilityEndDate)}` : ''}
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 shadow-md"
              size="lg"
              asChild
            >
              <a
                href={`https://t.me/${ownerTelegramHandle || 'placeholder'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <RiTelegram2Fill className="w-5 h-5" />
                <span>Contact</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {showEditButton && (
        <HousingDialog
          mode="edit"
          initialData={ad}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}
