/**
 * Custom hook for multi-step form navigation
 *
 * Manages step transitions, validation, and navigation state for wizard-style forms.
 * Provides validation-aware navigation that prevents moving forward with invalid data.
 *
 * @example
 * ```typescript
 * const {
 *   currentStep,
 *   goNext,
 *   goPrev,
 *   goTo,
 *   canNavigateTo,
 *   hasVisitedStep
 * } = useStepNavigation({
 *   totalSteps: 8,
 *   form,
 *   getStepSchema,
 *   getStepFields,
 *   contentScrollRef,
 *   onValidationError: (error) => setMapError(error)
 * });
 * ```
 */

import { useCallback, useState, type RefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ZodSchema } from 'zod';

export interface UseStepNavigationOptions<TFormValues extends Record<string, any>> {
  /** Total number of steps in the wizard */
  totalSteps: number;

  /** React Hook Form instance */
  form: UseFormReturn<TFormValues>;

  /** Function to get validation schema for a step */
  getStepSchema: (step: number) => ZodSchema | null;

  /** Function to get fields for a step */
  getStepFields: (step: number) => (keyof TFormValues)[];

  /** Ref to scrollable content container */
  contentScrollRef?: RefObject<HTMLDivElement | null>;

  /** Callback when validation error occurs (e.g., for map validation) */
  onValidationError?: (error: string | null, fields: string[]) => void;

  /** Steps that require lazy mounting (e.g., map, images) */
  lazyMountSteps?: number[];

  /** Initial step to display (1-based, defaults to 1) */
  initialStep?: number;
}

export interface UseStepNavigationReturn {
  /** Current step number (1-based) */
  currentStep: number;

  /** Navigate to next step (with validation) */
  goNext: () => Promise<void>;

  /** Navigate to previous step */
  goPrev: () => void;

  /** Navigate to specific step (if allowed) */
  goTo: (step: number) => void;

  /** Check if navigation to target step is allowed */
  canNavigateTo: (targetStep: number) => boolean;

  /** Check if a step has been visited (for lazy mounting) */
  hasVisitedStep: (step: number) => boolean;

  /** Mark a step as visited */
  markStepVisited: (step: number) => void;

  /** Mark all steps as visited (useful for edit mode) */
  markAllVisited: () => void;

  /** Reset navigation state */
  reset: () => void;
}

/**
 * Hook for managing multi-step form navigation with validation
 */
export function useStepNavigation<TFormValues extends Record<string, any>>(
  options: UseStepNavigationOptions<TFormValues>
): UseStepNavigationReturn {
  const {
    totalSteps,
    form,
    getStepSchema,
    getStepFields,
    contentScrollRef,
    onValidationError,
    lazyMountSteps = [],
    initialStep = 1,
  } = options;

  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([initialStep]));

  /**
   * Check if user can navigate to a target step
   * Validates all steps between current and target
   */
  const canNavigateTo = useCallback(
    (target: number): boolean => {
      if (target < 1 || target > totalSteps) return false;
      if (target <= currentStep) return true;

      // Validate all steps between current and target
      for (let s = 1; s < target; s++) {
        const schema = getStepSchema(s);
        if (!schema) continue;

        const result = schema.safeParse(form.getValues());
        if (!result.success) return false;
      }

      return true;
    },
    [currentStep, totalSteps, form, getStepSchema]
  );

  /**
   * Scroll content to top with smooth animation
   */
  const scrollToTop = useCallback(() => {
    try {
      contentScrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore scroll errors
    }
  }, [contentScrollRef]);

  /**
   * Navigate to a specific step
   */
  const goTo = useCallback(
    (step: number) => {
      if (step < 1 || step > totalSteps) return;
      if (!canNavigateTo(step)) return;

      // Mark lazy-mount steps as visited before navigation
      if (lazyMountSteps.includes(step)) {
        setVisitedSteps((prev) => new Set(prev).add(step));
      }

      setCurrentStep(step);
      setVisitedSteps((prev) => new Set(prev).add(step));
      scrollToTop();
    },
    [totalSteps, canNavigateTo, lazyMountSteps, scrollToTop]
  );

  /**
   * Navigate to previous step
   */
  const goPrev = useCallback(() => {
    goTo(currentStep - 1);
  }, [currentStep, goTo]);

  /**
   * Navigate to next step with validation
   * Blocks navigation if current step has validation errors
   * Triggers validation specifically for the current step on "Next" button click
   */
  const goNext = useCallback(async () => {
    const stepSchema = getStepSchema(currentStep);
    const stepFields = getStepFields(currentStep);

    // If no schema, allow navigation
    if (!stepSchema) {
      goTo(currentStep + 1);
      return;
    }

    // IMPORTANT: Trigger validation for current step fields
    // This ensures all fields in the step are validated before proceeding
    const formValues = form.getValues();
    const result = await stepSchema.safeParseAsync(formValues);

    if (!result.success) {
      // Validation failed - extract all errors from Zod validation
      const allErrors = result.error.errors;

      // Set errors from Zod for all failing fields in this step
      allErrors.forEach((error) => {
        if (error.path && error.path.length > 0) {
          const fieldName = error.path[0] as string;
          if (stepFields.includes(fieldName as keyof TFormValues)) {
            form.setError(fieldName as any, {
              type: 'validation',
              message: error.message,
            });
          }
        }
      });

      // Notify parent of validation error (for special handling like map validation)
      if (onValidationError) {
        const errorFields = allErrors
          .map((e) => e.path[0] as string)
          .filter((field) => stepFields.includes(field as keyof TFormValues));
        const firstError = allErrors[0]?.message;
        onValidationError(firstError ?? null, errorFields);
      }

      // Scroll to top to show validation errors
      scrollToTop();

      return; // Block navigation to next step
    }

    // Validation passed - clear all errors for this step
    stepFields.forEach((fieldName) => {
      form.clearErrors(fieldName as any);
    });

    // Clear validation error notification
    onValidationError?.(null, []);

    // Proceed to next step
    goTo(currentStep + 1);
  }, [currentStep, form, getStepSchema, getStepFields, goTo, onValidationError, scrollToTop]);

  /**
   * Check if a step has been visited
   */
  const hasVisitedStep = useCallback(
    (step: number): boolean => {
      return visitedSteps.has(step);
    },
    [visitedSteps]
  );

  /**
   * Mark a step as visited
   */
  const markStepVisited = useCallback((step: number) => {
    setVisitedSteps((prev) => new Set(prev).add(step));
  }, []);

  /**
   * Mark all steps as visited (useful for edit mode)
   */
  const markAllVisited = useCallback(() => {
    const allSteps = new Set<number>();
    for (let i = 1; i <= totalSteps; i++) {
      allSteps.add(i);
    }
    setVisitedSteps(allSteps);
  }, [totalSteps]);

  /**
   * Reset navigation state to initial or specified step
   */
  const reset = useCallback(
    (step: number = 1) => {
      const targetStep = Math.max(1, Math.min(step, totalSteps));
      setCurrentStep(targetStep);
      setVisitedSteps(new Set([targetStep]));
      scrollToTop();
    },
    [scrollToTop, totalSteps]
  );

  return {
    currentStep,
    goNext,
    goPrev,
    goTo,
    canNavigateTo,
    hasVisitedStep,
    markStepVisited,
    markAllVisited,
    reset,
  };
}
