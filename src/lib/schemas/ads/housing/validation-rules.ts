/**
 * Validation rule builders for creating reusable validation logic
 */

import { z } from 'zod';

/**
 * Type for a validation rule function
 */
export type ValidationRule<T = any> = (val: T, ctx: z.RefinementCtx) => void;

/**
 * Builder pattern for composing validation rules
 *
 * @example
 * const rules = new ValidationRuleBuilder<MyType>()
 *   .add(createRequiredRule('field1', 'Field 1 is required'))
 *   .add(createRequiredRule('field2', 'Field 2 is required'));
 *
 * schema.superRefine((val, ctx) => rules.apply(val, ctx));
 */
export class ValidationRuleBuilder<T> {
  private rules: ValidationRule<T>[] = [];

  /**
   * Add a validation rule to the builder
   */
  add(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Apply all rules to the value
   */
  apply(val: T, ctx: z.RefinementCtx): void {
    this.rules.forEach((rule) => rule(val, ctx));
  }
}

/**
 * Creates a rule that requires a field to be non-null
 *
 * @param field - The field path to validate
 * @param message - Error message if validation fails
 * @param condition - Optional condition that must be true for the rule to apply
 *
 * @example
 * // Always require the field
 * createRequiredRule('name', 'Name is required')
 *
 * // Conditionally require the field
 * createRequiredRule('agencyFee', 'Fee required', (val) => val.hasAgency === true)
 */
export const createRequiredRule = <T>(
  field: keyof T,
  message: string,
  condition?: (val: T) => boolean
): ValidationRule<T> => {
  return (val: T, ctx: z.RefinementCtx) => {
    // If condition exists and returns false, skip validation
    if (condition && !condition(val)) return;

    if (val[field] == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [field as string],
      });
    }
  };
};

/**
 * Creates a rule that requires a field to be null
 *
 * @param field - The field path to validate
 * @param message - Error message if validation fails
 * @param condition - Condition that must be true for the rule to apply
 *
 * @example
 * createMustBeNullRule('endDate', 'End date not allowed', (val) => val.rentalKind === 'PERMANENT')
 */
export const createMustBeNullRule = <T>(
  field: keyof T,
  message: string,
  condition: (val: T) => boolean
): ValidationRule<T> => {
  return (val: T, ctx: z.RefinementCtx) => {
    // Only validate if condition is true
    if (!condition(val)) return;

    if (val[field] != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [field as string],
      });
    }
  };
};

/**
 * Creates a rule that requires a specific value for a field
 *
 * @param field - The field path to validate
 * @param expectedValue - The expected value
 * @param message - Error message if validation fails
 * @param condition - Optional condition that must be true for the rule to apply
 *
 * @example
 * createValueRule('priceType', 'DAILY', 'Must use daily pricing', (val) => val.rentalKind === 'TEMPORARY')
 */
export const createValueRule = <T, V>(
  field: keyof T,
  expectedValue: V,
  message: string,
  condition?: (val: T) => boolean
): ValidationRule<T> => {
  return (val: T, ctx: z.RefinementCtx) => {
    if (condition && !condition(val)) return;

    if (val[field] !== expectedValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [field as string],
      });
    }
  };
};

/**
 * Creates a rule that validates a date range
 *
 * @param startField - The start date field
 * @param endField - The end date field
 * @param message - Error message if end is not after start
 * @param condition - Optional condition that must be true for the rule to apply
 *
 * @example
 * createDateRangeRule('startDate', 'endDate', 'End must be after start')
 */
export const createDateRangeRule = <T>(
  startField: keyof T,
  endField: keyof T,
  message: string,
  condition?: (val: T) => boolean
): ValidationRule<T> => {
  return (val: T, ctx: z.RefinementCtx) => {
    if (condition && !condition(val)) return;

    const start = val[startField];
    const end = val[endField];

    if (start instanceof Date && end instanceof Date && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [endField as string],
      });
    }
  };
};

/**
 * Creates a rule with custom validation logic
 *
 * @param validate - Custom validation function that returns true if valid
 * @param path - Field path for the error
 * @param message - Error message if validation fails
 * @param condition - Optional condition that must be true for the rule to apply
 *
 * @example
 * createCustomRule(
 *   (val) => val.negotiable || val.amount != null,
 *   'amount',
 *   'Price required when not negotiable'
 * )
 */
export const createCustomRule = <T>(
  validate: (val: T) => boolean,
  path: keyof T | string,
  message: string,
  condition?: (val: T) => boolean
): ValidationRule<T> => {
  return (val: T, ctx: z.RefinementCtx) => {
    if (condition && !condition(val)) return;

    if (!validate(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [path as string],
      });
    }
  };
};
