/**
 * Centralized configuration for housing feature icons and UI elements
 *
 * This file contains all icon components and configuration objects used
 * across housing-related components for consistent UI representation.
 *
 * Benefits:
 * - Single source of truth for housing feature icons
 * - Easy maintenance and updates
 * - Consistent icon usage across components
 * - Prevents duplicate icon imports
 */

import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import type { ReactNode } from 'react';
import { BiSolidDryer, BiSolidWasher } from 'react-icons/bi';
import { FaCouch, FaUtensils } from 'react-icons/fa';
import {
  MdBalcony,
  MdBathtub,
  MdElevator,
  MdKitchen,
  MdOutlineBathtub,
  MdOutlineLocalFireDepartment,
  MdOutlineStairs,
  MdWifi,
  MdWindow,
} from 'react-icons/md';
import { TbAirConditioning, TbSparkles } from 'react-icons/tb';

/**
 * Configuration for a selectable chip option
 */
export interface ChipOption {
  /** Field name in the form */
  fieldName: keyof HousingFormValues;
  /** Label displayed on the chip */
  label: string;
  /** Optional icon component or emoji */
  icon?: ReactNode;
}

/**
 * Icon for Floor field (counter)
 * Used in Step 4 - Property Features
 */
export const FloorIcon = MdOutlineStairs;

/**
 * Icon for Number of Bathrooms field (counter)
 * Used in Step 4 - Property Features
 */
export const BathroomsIcon = MdOutlineBathtub;

/**
 * Icon for Heating Type field (selection list)
 * Used in Step 4 - Property Features
 */
export const HeatingIcon = MdOutlineLocalFireDepartment;

/**
 * Core property features chip options
 * Used in Step 4 for basic property attributes
 */
export const CORE_FEATURES_CHIPS: readonly ChipOption[] = [
  {
    fieldName: 'newlyRenovated',
    label: 'Newly renovated',
    icon: <TbSparkles className="text-lg" />,
  },
  {
    fieldName: 'furnished',
    label: 'Furnished',
    icon: <FaCouch className="text-lg" />,
  },
  {
    fieldName: 'kitchenEquipped',
    label: 'Kitchen equipped',
    icon: <MdKitchen className="text-lg" />,
  },
  {
    fieldName: 'privateBathroom',
    label: 'Private bathroom',
    icon: <MdBathtub className="text-lg" />,
  },
  {
    fieldName: 'balcony',
    label: 'Balcony',
    icon: <MdBalcony className="text-lg" />,
  },
  {
    fieldName: 'hasElevator',
    label: 'Elevator',
    icon: <MdElevator className="text-lg" />,
  },
] as const;

/**
 * Comfort and convenience amenities chip options
 * Used in Step 4 for additional comfort features
 */
export const COMFORT_AMENITIES_CHIPS: readonly ChipOption[] = [
  {
    fieldName: 'wifi',
    label: 'Wi‑Fi',
    icon: <MdWifi className="text-lg" />,
  },
  {
    fieldName: 'airConditioning',
    label: 'Air conditioning',
    icon: <TbAirConditioning className="text-lg" />,
  },
  {
    fieldName: 'dishwasher',
    label: 'Dishwasher',
    icon: <FaUtensils className="text-lg" />,
  },
  {
    fieldName: 'washingMachine',
    label: 'Washing machine',
    icon: <BiSolidWasher className="text-lg" />,
  },
  {
    fieldName: 'clothesDryer',
    label: 'Clothes dryer',
    icon: <BiSolidDryer className="text-lg" />,
  },
  {
    fieldName: 'doubleGlazedWindows',
    label: 'Double glazed',
    icon: <MdWindow className="text-lg" />,
  },
] as const;
