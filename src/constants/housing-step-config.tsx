/**
 * Centralized step configuration for housing form wizard
 *
 * This configuration provides:
 * - Step metadata (id, title, label, icon)
 * - Associated validation schema
 * - Step component reference
 * - Field mappings for validation
 *
 * Benefits:
 * - Single source of truth for step information
 * - Easy to add/remove/reorder steps
 * - Type-safe step definitions
 * - Eliminates scattered switch statements
 */

import type { ComponentType } from 'react';
import type { Control } from 'react-hook-form';
import { FaCalendar, FaEuroSign } from 'react-icons/fa';
import { FaEye, FaHouse, FaHouseChimneyUser, FaImages, FaLocationDot } from 'react-icons/fa6';
import { IoSparkles } from 'react-icons/io5';

import type { ZodSchema } from 'zod';

import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  STEP_FIELDS,
  type HousingFormValues,
} from '@/lib/schemas/ads/housing-schema';

import { COMFORT_AMENITIES_CHIPS, CORE_FEATURES_CHIPS } from '@/constants/housing-features-config';
import HousingDialogStep1 from '../components/ad-forms/housing/housing-dialog-step-1';
import HousingDialogStep2 from '../components/ad-forms/housing/housing-dialog-step-2';
import HousingDialogStep3 from '../components/ad-forms/housing/housing-dialog-step-3';
import HousingDialogStep4 from '../components/ad-forms/housing/housing-dialog-step-4';
import HousingDialogStep5 from '../components/ad-forms/housing/housing-dialog-step-5';
import HousingDialogStep6 from '../components/ad-forms/housing/housing-dialog-step-6';
import { HousingDialogStep7Images } from '../components/ad-forms/housing/housing-dialog-step-7-images';
import HousingDialogStep8Review from '../components/ad-forms/housing/housing-dialog-step-8-review';
// Re-export for backwards compatibility
export { COMFORT_AMENITIES_CHIPS, CORE_FEATURES_CHIPS };

/**
 * Base props that all step components accept
 * Each step component will use a subset of these props
 */
export interface BaseStepComponentProps {
  /** React Hook Form control object (Steps 1-7) */
  control?: Control<HousingFormValues>;
  /** Function to revalidate a specific form field (Steps 1-7) */
  revalidateField?: (fieldName: keyof HousingFormValues) => Promise<void>;
  /** React Hook Form instance (Steps 2, 3, 6, 7, 8) */
  form?: any;
  /** User's city for boundary validation (Step 6 only) */
  userCity?: any;
  /** Map validation error message (Step 6 only) */
  mapValidationError?: string | null;
  /** Function to clear map validation error (Step 6 only) */
  clearMapValidationError?: () => void;
}

/**
 * Type for step component - flexible to accept various prop combinations
 */
export type StepComponentType = ComponentType<any> | null;

/**
 * Configuration for a single step in the wizard
 */
export interface StepConfig {
  /** Unique step identifier (1-based) */
  id: number;

  /** Short label shown in stepper UI */
  label: string;

  /** Full title for accessibility */
  title: string;

  /** Icon component for visual representation */
  icon: ComponentType<{ className?: string }>;

  /** Zod validation schema for this step */
  schema: ZodSchema | null;

  /** Step component to render */
  component: StepComponentType;

  /** Form fields that belong to this step */
  fields: (keyof HousingFormValues)[];

  /** Whether this step requires lazy mounting (for performance) */
  lazyMount?: boolean;
}

/**
 * Complete step configuration for the housing form wizard
 *
 * @example
 * ```typescript
 * // Get schema for step 2
 * const schema = HOUSING_STEP_CONFIG[1].schema;
 *
 * // Get all fields for step 3
 * const fields = HOUSING_STEP_CONFIG[2].fields;
 *
 * // Render step component
 * const StepComponent = HOUSING_STEP_CONFIG[0].component;
 * <StepComponent control={control} revalidateField={revalidateField} />
 * ```
 */
export const HOUSING_STEP_CONFIG: readonly StepConfig[] = [
  {
    id: 1,
    label: 'Basics',
    title: 'Basic Details',
    icon: FaHouse,
    schema: step1Schema,
    component: HousingDialogStep1,
    fields: STEP_FIELDS[1],
  },
  {
    id: 2,
    label: 'Availability',
    title: 'Availability & Contract',
    icon: FaCalendar,
    schema: step2Schema,
    component: HousingDialogStep2,
    fields: STEP_FIELDS[2],
  },
  {
    id: 3,
    label: 'Pricing',
    title: 'Pricing Details',
    icon: FaEuroSign,
    schema: step3Schema,
    component: HousingDialogStep3,
    fields: STEP_FIELDS[3],
  },
  {
    id: 4,
    label: 'Features',
    title: 'Property Features',
    icon: IoSparkles,
    schema: step4Schema,
    component: HousingDialogStep4,
    fields: STEP_FIELDS[4],
  },
  {
    id: 5,
    label: 'Household',
    title: 'Household Information',
    icon: FaHouseChimneyUser,
    schema: step5Schema,
    component: HousingDialogStep5,
    fields: STEP_FIELDS[5],
  },
  {
    id: 6,
    label: 'Location',
    title: 'Location Details',
    icon: FaLocationDot,
    schema: step6Schema,
    component: HousingDialogStep6,
    fields: STEP_FIELDS[6],
    lazyMount: true, // Map is expensive, mount only when needed
  },
  {
    id: 7,
    label: 'Images',
    title: 'Property Images',
    icon: FaImages,
    schema: step7Schema,
    component: HousingDialogStep7Images,
    fields: STEP_FIELDS[7],
    lazyMount: true, // Image uploads are heavy, mount only when needed
  },
  {
    id: 8,
    label: 'Review',
    title: 'Review & Submit',
    icon: FaEye,
    schema: null, // Review step doesn't need validation
    component: HousingDialogStep8Review,
    fields: [],
  },
] as const;

/**
 * Total number of steps in the wizard
 */
export const TOTAL_STEPS = HOUSING_STEP_CONFIG.length;

/**
 * Helper to get step configuration by step number
 *
 * @param stepNumber - Step number (1-based)
 * @returns Step configuration or undefined if not found
 */
export function getStepConfig(stepNumber: number): StepConfig | undefined {
  return HOUSING_STEP_CONFIG.find((step) => step.id === stepNumber);
}

/**
 * Helper to get validation schema for a specific step
 *
 * @param stepNumber - Step number (1-based)
 * @returns Zod schema or null if step has no validation
 */
export function getStepSchema(stepNumber: number): ZodSchema | null {
  const config = getStepConfig(stepNumber);
  return config?.schema ?? null;
}

/**
 * Helper to get fields for a specific step
 *
 * @param stepNumber - Step number (1-based)
 * @returns Array of field names
 */
export function getStepFields(stepNumber: number): (keyof HousingFormValues)[] {
  const config = getStepConfig(stepNumber);
  return config?.fields ?? [];
}

/**
 * Type guard to check if a step requires lazy mounting
 *
 * @param stepNumber - Step number (1-based)
 * @returns true if step should be lazy mounted
 */
export function shouldLazyMount(stepNumber: number): boolean {
  const config = getStepConfig(stepNumber);
  return config?.lazyMount ?? false;
}
