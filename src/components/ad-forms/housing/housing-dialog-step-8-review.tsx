'use client';

import { Separator } from '@/components/ui/separator';
import {
  BathroomsIcon,
  COMFORT_AMENITIES_CHIPS,
  CORE_FEATURES_CHIPS,
  FloorIcon,
  HeatingIcon,
} from '@/constants/housing-features-config';
import { useCityById } from '@/contexts/cities-context';
import { BillsPolicy, HousingRentalKind } from '@/generated/prisma';
import { useSession } from '@/lib/auth/client';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { FaHome } from 'react-icons/fa';
import { MdOutlineElectricalServices } from 'react-icons/md';
import { HOUSING_STEP_CONFIG } from '../../../constants/housing-step-config';

/**
 * Props for the Housing Dialog Step 8 (Review) component
 */
export interface HousingDialogStep8ReviewProps {
  /** React Hook Form instance for accessing form values */
  form: UseFormReturn<HousingFormValues>;
}

/**
 * Formats enum values to human-readable labels
 */
const formatEnumLabel = (value: string | null | undefined): string => {
  if (!value) return '—';
  // Convert SNAKE_CASE or PascalCase to Title Case
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formats date to readable string
 */
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return new Date(date as any).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Review section component with consistent styling and background icon
 */
interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ title, children, icon: Icon }) => (
  <div className="relative border pb-3 border-neutral-200 rounded-xl bg-white/50 overflow-hidden">
    {/* Background Icon */}
    <Icon className="absolute -right-4 top-1/3 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 text-neutral-200/40 pointer-events-none" />

    {/* Content */}
    <div className="relative z-10">
      <h4 className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-xs sm:text-sm text-neutral-700">
        <Icon />
        {title}
      </h4>

      <Separator className="mb-2" />
      {children}
    </div>
  </div>
);

/**
 * Boolean indicator component with enhanced styling
 */
interface BooleanIndicatorProps {
  label: string;
  value: boolean;
  icon?: React.ReactNode;
}

const BooleanIndicator: React.FC<BooleanIndicatorProps> = ({ label, value, icon }) => (
  <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-all">
    {value ? (
      <BsCheckCircleFill className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
    ) : (
      <BsCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-300 flex-shrink-0" />
    )}
    <div
      className={`flex items-center gap-1.5 flex-1 ${value ? 'text-green-700' : 'text-neutral-400'}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-[10px] sm:text-xs font-medium">{label}</span>
    </div>
  </div>
);

/**
 * Housing Dialog Step 8: Review & Submit
 *
 * Displays a comprehensive summary of all form data entered in previous steps
 * for user review before final submission.
 *
 * **Features:**
 * - Conditionally renders based on rental kind (Temporary vs Permanent)
 * - Organized in logical sections
 * - Clear visual indicators for boolean values
 * - Responsive design with mobile-first approach
 * - Handles missing/optional values gracefully
 *
 * @example
 * ```tsx
 * <HousingDialogStep8Review form={form} />
 * ```
 */
function HousingDialogStep8ReviewComponent({ form }: HousingDialogStep8ReviewProps) {
  // Use useWatch to reactively watch all form values
  const values = useWatch({ control: form.control }) as Partial<HousingFormValues>;
  const session = useSession();
  const userCity = useCityById(session.data?.user?.cityId);

  const rentalKind = values.rentalKind;
  const isTemporary = rentalKind === HousingRentalKind.TEMPORARY;
  const isPermanent = rentalKind === HousingRentalKind.PERMANENT;
  const hasAgencyFee = Boolean(values.hasAgencyFee);
  const showBillsEstimate =
    values.billsPolicy === BillsPolicy.EXCLUDED || values.billsPolicy === BillsPolicy.PARTIAL;

  // Get step icons from config
  const BasicsIcon = HOUSING_STEP_CONFIG[0].icon; // Step 1 - Basics
  const AvailabilityIcon = HOUSING_STEP_CONFIG[1].icon; // Step 2 - Availability
  const PricingIcon = HOUSING_STEP_CONFIG[2].icon; // Step 3 - Pricing
  const FeaturesIcon = HOUSING_STEP_CONFIG[3].icon; // Step 4 - Features
  const HouseholdIcon = HOUSING_STEP_CONFIG[4].icon; // Step 5 - Household
  const LocationIcon = HOUSING_STEP_CONFIG[5].icon; // Step 6 - Location
  const ImagesIcon = HOUSING_STEP_CONFIG[6].icon; // Step 7 - Images
  const ReviewIcon = HOUSING_STEP_CONFIG[7].icon; // Step 8 - Review

  // Helper to get icon for a feature by field name
  const getFeatureIcon = (fieldName: keyof HousingFormValues): React.ReactNode => {
    const coreFeature = CORE_FEATURES_CHIPS.find((chip) => chip.fieldName === fieldName);
    if (coreFeature) return coreFeature.icon;

    const comfortFeature = COMFORT_AMENITIES_CHIPS.find((chip) => chip.fieldName === fieldName);
    if (comfortFeature) return comfortFeature.icon;

    return null;
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <ReviewIcon className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Review & Submit</h3>
            <p className="step-header-description">
              Please review all details before publishing your ad
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* BASICS & AVAILABILITY - Side by side */}
        <div className="grid grid-cols-2 gap-3">
          {/* BASICS */}
          <ReviewSection title="Basics" icon={BasicsIcon}>
            <div className="space-y-2 px-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                    Rental Kind
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                    {formatEnumLabel(values.rentalKind)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                    Property Type
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                    {formatEnumLabel(values.propertyType)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                    Unit Type
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                    {formatEnumLabel(values.unitType)}
                  </span>
                </div>
              </div>
            </div>
          </ReviewSection>

          {/* AVAILABILITY */}
          <ReviewSection title="Availability" icon={AvailabilityIcon}>
            <div className="px-2">
              {/* Date Banner */}
              {isTemporary ? (
                /* Temporary: Vertical layout with arrow */
                <div className="space-y-1">
                  {/* Start Date */}
                  <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Date Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Start Date
                      </div>
                      <time className="block text-[10px] sm:text-sm font-bold text-emerald-900 truncate">
                        {formatDate(values.availabilityStartDate)}
                      </time>
                    </div>
                  </div>

                  {/* Divider with Arrow & Duration */}
                  <div className="flex items-center gap-1 pl-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                    {values.availabilityStartDate && values.availabilityEndDate && (
                      <span className="text-[10px] sm:text-xs font-semibold text-neutral-500">
                        {Math.max(
                          0,
                          Math.ceil(
                            (new Date(values.availabilityEndDate).getTime() -
                              new Date(values.availabilityStartDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}{' '}
                        night
                        {Math.ceil(
                          (new Date(values.availabilityEndDate).getTime() -
                            new Date(values.availabilityStartDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) !== 1
                          ? 's'
                          : ''}
                      </span>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-red-50/50 border border-red-200/50">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Date Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-red-700">
                        End Date
                      </div>
                      <time className="block text-[10px] sm:text-sm font-bold text-red-900 truncate">
                        {formatDate(values.availabilityEndDate)}
                      </time>
                    </div>
                  </div>
                </div>
              ) : (
                /* Permanent: Single start date */
                <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  {/* Date Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Start Date
                    </div>
                    <time className="block text-[10px] sm:text-sm font-bold text-emerald-900 truncate">
                      {formatDate(values.availabilityStartDate)}
                    </time>
                  </div>
                </div>
              )}

              {/* Contract & Residenza (Permanent only) */}
              {isPermanent && (
                <div className="grid grid-cols-1 gap-2 pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                      Contract Type
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                      {formatEnumLabel(values.contractType)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                      Residenza Available
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                      {values.residenzaAvailable == null
                        ? '—'
                        : values.residenzaAvailable
                          ? 'Yes'
                          : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ReviewSection>
        </div>

        {/* PRICING - Minimal tile layout */}
        <ReviewSection title="Pricing" icon={PricingIcon}>
          <div className="space-y-2 px-4">
            {/* Main Price Tile - Full Width */}
            <div className="bg-neutral-50/30 border border-neutral-200/60 rounded-lg p-3">
              {values.priceNegotiable ? (
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-amber-700">Negotiable</span>
                  <p className="text-[9px] sm:text-[10px] text-amber-600 mt-0.5">
                    Price upon discussion
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-neutral-600 font-medium uppercase tracking-wide">
                    {isTemporary ? 'Price / Night' : 'Price / Month'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <PricingIcon className="text-base sm:text-lg text-neutral-600" />
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900">
                      {values.priceAmount ?? '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isPermanent && (
              <>
                {/* Deposit & Agency Fee Row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Deposit Tile */}
                  <div className="flex items-center justify-between bg-neutral-50/30 border border-neutral-200/60 rounded-lg p-2.5">
                    <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                      Deposit
                    </span>
                    {values.depositAmount != null ? (
                      <div className="flex items-center gap-0.5">
                        <PricingIcon className="text-xs sm:text-sm text-neutral-600" />
                        <span className="text-base sm:text-lg font-bold font-mono text-neutral-900">
                          {values.depositAmount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-neutral-400 italic">
                        No deposit
                      </span>
                    )}
                  </div>

                  {/* Agency Fee Tile */}
                  <div className="flex items-center justify-between bg-neutral-50/30 border border-neutral-200/60 rounded-lg p-2.5">
                    <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                      Agency Fee
                    </span>
                    {hasAgencyFee && values.agencyFeeAmount != null ? (
                      <div className="flex items-center gap-0.5">
                        <PricingIcon className="text-xs sm:text-sm text-neutral-600" />
                        <span className="text-base sm:text-lg font-bold font-mono text-neutral-900">
                          {values.agencyFeeAmount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] sm:text-sm text-neutral-400 italic">
                        No agency fee
                      </span>
                    )}
                  </div>
                </div>

                {/* Bills Information */}
                <div className="pt-2 px-4 border-t border-neutral-200/50 space-y-1.5">
                  <div className=" flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-neutral-600 font-medium">
                      Bills Policy
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                      {formatEnumLabel(values.billsPolicy)}
                    </span>
                  </div>
                  {showBillsEstimate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-neutral-600">
                        Bills monthly estimate
                      </span>
                      {values.billsMonthlyEstimate != null ? (
                        <div className="flex items-baseline gap-0.5">
                          <PricingIcon className="text-[10px] sm:text-xs text-neutral-600" />
                          <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900">
                            {values.billsMonthlyEstimate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] sm:text-sm text-neutral-400 italic">
                          Not specified
                        </span>
                      )}
                    </div>
                  )}
                  {values.billsNotes && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-neutral-600">Bills note</span>
                      <p className="text-[9px] sm:text-[10px] text-neutral-600 pt-1.5 border-t border-neutral-200/50 italic leading-relaxed">
                        {values.billsNotes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ReviewSection>

        {/* FEATURES - Minimal design */}
        <ReviewSection title="Features" icon={FeaturesIcon}>
          <div className="space-y-5 px-4">
            {/* Core Attributes */}
            <div>
              <div className="pl-3 flex items-center gap-1.5 mb-2">
                <FaHome className="text-neutral-600 text-xs sm:text-sm" />
                <p className="text-[9px] sm:text-[10px] text-neutral-600 font-medium uppercase tracking-wide">
                  Core Attributes
                </p>
              </div>
              <div className="space-y-3 border border-neutral-200/50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 border-b border-neutral-200/50 pb-3">
                  <BooleanIndicator
                    label="Newly renovated"
                    value={!!values.newlyRenovated}
                    icon={getFeatureIcon('newlyRenovated')}
                  />
                  <BooleanIndicator
                    label="Furnished"
                    value={!!values.furnished}
                    icon={getFeatureIcon('furnished')}
                  />
                  <BooleanIndicator
                    label="Kitchen equipped"
                    value={!!values.kitchenEquipped}
                    icon={getFeatureIcon('kitchenEquipped')}
                  />
                  <BooleanIndicator
                    label="Private bathroom"
                    value={!!values.privateBathroom}
                    icon={getFeatureIcon('privateBathroom')}
                  />
                  <BooleanIndicator
                    label="Balcony"
                    value={!!values.balcony}
                    icon={getFeatureIcon('balcony')}
                  />
                  <BooleanIndicator
                    label="Elevator"
                    value={!!values.hasElevator}
                    icon={getFeatureIcon('hasElevator')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 px-4">
                  <div className="flex items-start gap-1.5">
                    <FloorIcon className="text-neutral-600 text-sm sm:text-base mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                        Floor
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                        {values.floorNumber != null ? values.floorNumber.toString() : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <BathroomsIcon className="text-neutral-600 text-sm sm:text-base mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                        Bathrooms
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                        {values.numberOfBathrooms != null
                          ? values.numberOfBathrooms.toString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 col-span-2">
                    <HeatingIcon className="text-neutral-600 text-sm sm:text-base mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                        Heating
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                        {formatEnumLabel(values.heatingType)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comfort & Convenience */}
            <div>
              <div className="pl-3 flex items-center gap-1.5 mb-2">
                <MdOutlineElectricalServices className="text-neutral-600 text-xs sm:text-sm" />
                <p className="text-[9px] sm:text-[10px] text-neutral-600 font-medium uppercase tracking-wide">
                  Comfort & Convenience
                </p>
              </div>
              <div className="border border-neutral-200/50 p-3 rounded-lg grid grid-cols-2 gap-2">
                <BooleanIndicator
                  label="Wi-Fi"
                  value={!!values.wifi}
                  icon={getFeatureIcon('wifi')}
                />
                <BooleanIndicator
                  label="Air conditioning"
                  value={!!values.airConditioning}
                  icon={getFeatureIcon('airConditioning')}
                />
                <BooleanIndicator
                  label="Dishwasher"
                  value={!!values.dishwasher}
                  icon={getFeatureIcon('dishwasher')}
                />
                <BooleanIndicator
                  label="Washing machine"
                  value={!!values.washingMachine}
                  icon={getFeatureIcon('washingMachine')}
                />
                <BooleanIndicator
                  label="Clothes dryer"
                  value={!!values.clothesDryer}
                  icon={getFeatureIcon('clothesDryer')}
                />
                <BooleanIndicator
                  label="Double glazed"
                  value={!!values.doubleGlazedWindows}
                  icon={getFeatureIcon('doubleGlazedWindows')}
                />
              </div>
            </div>
          </div>
        </ReviewSection>

        {/* HOUSEHOLD - Minimal design */}
        <ReviewSection title="Household" icon={HouseholdIcon}>
          <div className="space-y-2 px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  Household Size <span className="lowercase tracking-wider">(in total)</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                  {values.householdSize != null ? values.householdSize : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  Looking For
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                  {formatEnumLabel(values.genderPreference)}
                </span>
              </div>
            </div>
            {values.householdDescription && (
              <div className="pt-2 border-t border-neutral-200/50">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  Notes
                </span>
                <p className="text-[10px] sm:text-xs text-neutral-700 mt-1 leading-relaxed">
                  {values.householdDescription}
                </p>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* LOCATION - Minimal design */}
        <ReviewSection title="Location" icon={LocationIcon}>
          <div className="space-y-2 px-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                City
              </span>
              <span className="text-sm sm:text-base font-semibold text-neutral-900">
                {userCity?.name ?? '—'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200/50">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  Neighborhood
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                  {values.neighborhood ?? '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  Street
                </span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                  {values.streetHint ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </ReviewSection>

        {/* IMAGES - Minimal display */}
        <ReviewSection title="Images" icon={ImagesIcon}>
          <div className="px-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  Gallery
                </span>
                <span className="text-sm sm:text-base font-semibold text-neutral-900">
                  {values.images?.length || 0} photo{values.images?.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                {values.coverImageStorageKey ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50/80 rounded-md border border-green-200/60">
                    <BsCheckCircleFill className="text-green-600 text-xs" />
                    <span className="text-[9px] sm:text-[10px] text-green-700 font-medium">
                      Cover set
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50/80 rounded-md border border-red-200/60">
                    <span className="text-[9px] sm:text-[10px] text-red-700 font-medium">
                      ⚠ No cover
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ReviewSection>
      </div>
    </div>
  );
}

/**
 * Memoized version of Step 8 Review component to prevent unnecessary re-renders
 */
const HousingDialogStep8Review = React.memo(HousingDialogStep8ReviewComponent);

export default HousingDialogStep8Review;
