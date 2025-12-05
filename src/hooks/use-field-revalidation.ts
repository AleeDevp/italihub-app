/**
 * Custom hook for field-level revalidation
 *
 * Provides granular validation for individual form fields using step-specific schemas.
 * This enables real-time validation feedback without validating the entire form.
 *
 * @example
 * ```typescript
 * const revalidateField = useFieldRevalidation(form, currentStep);
 *
 * // In your onChange handler:
 * onChange={(value) => {
 *   field.onChange(value);
 *   void revalidateField('priceAmount');
 * }}
 * ```
 */

import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ZodSchema } from 'zod';

/**
 * Hook for revalidating individual form fields
 *
 * @param form - React Hook Form instance
 * @param currentStep - Current step number (1-based)
 * @param getStepSchema - Function to get validation schema for a step
 * @returns Async function to revalidate a specific field
 */
export function useFieldRevalidation<TFormValues extends Record<string, any>>(
  form: UseFormReturn<TFormValues>,
  currentStep: number,
  getStepSchema: (step: number) => ZodSchema | null
) {
  return useCallback(
    async (fieldName: keyof TFormValues) => {
      const stepSchema = getStepSchema(currentStep);
      if (!stepSchema) return;

      const result = await stepSchema.safeParseAsync(form.getValues());

      if (result.success) {
        // Validation passed, clear error for this field
        form.clearErrors(fieldName as any);
      } else {
        // Check if this specific field has an error
        const zodErrors = result.error.flatten().fieldErrors as Record<
          string,
          string[] | undefined
        >;
        const fieldError = zodErrors[fieldName as string];

        if (fieldError && fieldError.length > 0) {
          // Field still has error, set it
          form.setError(fieldName as any, {
            type: 'manual',
            message: fieldError[0],
          });
        } else {
          // Field is now valid, clear its error
          form.clearErrors(fieldName as any);
        }
      }
    },
    [form, currentStep, getStepSchema]
  );
}
