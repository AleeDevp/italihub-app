# Housing Validation Architecture Guide

## Quick Overview

This guide explains the complete housing form validation architecture. Use this to understand how validation works and how to add/modify rules.

---

## 📁 File Structure

```
src/lib/schemas/ads/
├── housing-schema.ts              // Legacy re-export (backward compatibility)
└── housing/
    ├── index.ts                   // ⭐ MAIN FILE - All schemas & exports
    ├── types.ts                   // TypeScript interfaces
    ├── validation-messages.ts     // Error message constants
    ├── validation-config.ts       // Validation configuration
    ├── validation-rules.ts        // Reusable rule builders
    └── utils.ts                   // Helper functions & utilities
```

**Start here:** `housing/index.ts` contains all the validation logic.

---

## 🏗️ Architecture Pattern

### 1. Base Schema (Permissive)

All fields are **optional/nullable** in the base schema to support incremental validation:

```typescript
const baseHousingSchema = z.object({
  rentalKind: requiredEnum(HousingRentalKind),
  priceAmount: currencyInt.optional().nullable(), // Permissive
  depositAmount: currencyInt.optional().nullable(), // Permissive
  // ... all fields
});
```

### 2. Step Schemas (Incremental Validation)

Each step validates **only its relevant fields**:

```typescript
export const step1Schema = baseHousingSchema
  .pick({ rentalKind: true, unitType: true, propertyType: true, roomType: true })
  .superRefine((val, ctx) => applyStep1Rules(val, ctx));

export const step3Schema = baseHousingSchema
  .pick({ rentalKind: true, priceType: true, priceAmount: true /* ... */ })
  .transform((val) => ({
    ...val,
    priceType: val.rentalKind === 'TEMPORARY' ? 'DAILY' : 'MONTHLY', // Auto-set
  }))
  .superRefine((val, ctx) => applyPricingRules(val, ctx));
```

### 3. Discriminated Union (Final Validation)

Full form validation uses a discriminated union for type safety:

```typescript
const temporaryBranch = baseHousingSchema.extend({
  rentalKind: z.literal(HousingRentalKind.TEMPORARY),
});

const permanentBranch = baseHousingSchema.extend({
  rentalKind: z.literal(HousingRentalKind.PERMANENT),
});

export const housingSchema = z
  .discriminatedUnion('rentalKind', [temporaryBranch, permanentBranch])
  .transform((val) => ({ ...val, priceType: /* auto-set */ }))
  .superRefine((val, ctx) => {
    applyStep1Rules(val, ctx);
    applyStep2Rules(val, ctx);
    applyPricingRules(val, ctx);
  });
```

---

## 🎯 Validation Rules Pattern

### Rental Kind Logic (TEMPORARY vs PERMANENT)

**TEMPORARY rentals:**

- ✅ Must have: `priceType: DAILY`, `availabilityEndDate`
- ❌ Must be null: `depositAmount`, `agencyFeeAmount`, `billsPolicy`, `contractType`, `residenzaAvailable`

**PERMANENT rentals:**

- ✅ Must have: `priceType: MONTHLY`, `billsPolicy`, `contractType`, `residenzaAvailable`
- ❌ Must be null: `availabilityEndDate`

### Validation Function Pattern

Each validation function follows this structure:

```typescript
function validateTemporaryPricing(val: TemporaryRentalPricing, ctx: z.RefinementCtx) {
  // 1. Check required values
  if (!validationUtils.isPriceValid(val.priceAmount, val.priceNegotiable)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.PRICE.REQUIRED_WHEN_NOT_NEGOTIABLE,
      path: ['priceAmount'],
    });
  }

  // 2. Check fields that must be null
  if (val.depositAmount != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.DEPOSIT.NOT_APPLICABLE_TEMPORARY,
      path: ['depositAmount'],
    });
  }
}
```

---

## 📝 How to Add a New Validation Rule

### Example: Add "Minimum Stay Duration" for TEMPORARY rentals

#### Step 1: Add to Types (`types.ts`)

```typescript
export interface TemporaryRentalAvailability {
  rentalKind: 'TEMPORARY';
  availabilityStartDate: Date | null;
  availabilityEndDate: Date | null;
  minStayDays: number | null; // ⭐ NEW FIELD
  contractType: null;
  residenzaAvailable: null;
}
```

#### Step 2: Add Error Message (`validation-messages.ts`)

```typescript
export const VALIDATION_MESSAGES = {
  // ... existing messages
  DATE: {
    START_REQUIRED: 'Select a start date!',
    END_REQUIRED: 'End date is required for temporary rentals',
    MIN_STAY_REQUIRED: 'Minimum stay duration is required', // ⭐ NEW
    MIN_STAY_INVALID: 'Minimum stay must be at least 1 day', // ⭐ NEW
  },
};
```

#### Step 3: Add to Base Schema (`index.ts`)

```typescript
const baseHousingSchema = z.object({
  // ... existing fields
  availabilityStartDate: z.date(/* ... */),
  availabilityEndDate: z.date().optional().nullable(),
  minStayDays: z.number().int().min(1).optional().nullable(), // ⭐ NEW
  // ... rest of fields
});
```

#### Step 4: Add Validation Logic (`index.ts`)

```typescript
function applyStep2Rules(val: Step2Fields, ctx: z.RefinementCtx) {
  if (val.rentalKind === HousingRentalKind.TEMPORARY) {
    // Existing validation...
    if (!val.availabilityEndDate) {
      ctx.addIssue({
        /* ... */
      });
    }

    // ⭐ NEW: Validate minimum stay
    if (val.minStayDays == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.DATE.MIN_STAY_REQUIRED,
        path: ['minStayDays'],
      });
    }
  } else if (val.rentalKind === HousingRentalKind.PERMANENT) {
    // ⭐ NEW: Permanent cannot have minStayDays
    if (val.minStayDays != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum stay not applicable for permanent rentals',
        path: ['minStayDays'],
      });
    }
  }
}
```

#### Step 5: Update Step Schema (`index.ts`)

```typescript
export const step2Schema = baseHousingSchema
  .pick({
    rentalKind: true,
    availabilityStartDate: true,
    availabilityEndDate: true,
    minStayDays: true, // ⭐ ADD TO STEP 2
    contractType: true,
    residenzaAvailable: true,
  })
  .superRefine((val, ctx) => applyStep2Rules(val as Step2Fields, ctx));
```

#### Step 6: Update STEP_FIELDS (`index.ts`)

```typescript
export const STEP_FIELDS: Record<number, (keyof HousingFormValues)[]> = {
  1: ['rentalKind', 'unitType', 'propertyType', 'roomType'],
  2: [
    'rentalKind',
    'availabilityStartDate',
    'availabilityEndDate',
    'minStayDays', // ⭐ ADD HERE
    'contractType',
    'residenzaAvailable',
  ],
  // ... rest
};
```

#### Step 7: Update Prune Function (`index.ts`)

```typescript
export function pruneHousingValuesForBranch(values: T): T {
  const out: any = { ...values };

  if (out.rentalKind === HousingRentalKind.PERMANENT) {
    out.availabilityEndDate = null;
    out.minStayDays = null; // ⭐ Clear for permanent
    out.priceType = HousingPriceType.MONTHLY;
  } else if (out.rentalKind === HousingRentalKind.TEMPORARY) {
    out.contractType = null;
    out.residenzaAvailable = null;
    // minStayDays is kept for temporary ⭐
    out.priceType = HousingPriceType.DAILY;
    // ... rest
  }

  return out as T;
}
```

**Done!** The validation is now enforced across the form.

---

## 🔧 Using Reusable Rule Builders

For complex rules, use the rule builder pattern from `validation-rules.ts`:

### Example: Add a custom date range rule

```typescript
import { createCustomRule, createDateRangeRule } from './validation-rules';

// In your validation function:
function applyStep2Rules(val: Step2Fields, ctx: z.RefinementCtx) {
  // Use pre-built date range rule
  const dateRangeRule = createDateRangeRule(
    'availabilityStartDate',
    'availabilityEndDate',
    VALIDATION_MESSAGES.DATE.END_AFTER_START,
    (val) => val.rentalKind === HousingRentalKind.TEMPORARY
  );

  dateRangeRule(val, ctx);

  // Or create a custom rule
  const minStayRule = createCustomRule(
    (val) => {
      if (!val.minStayDays || !val.availabilityEndDate || !val.availabilityStartDate) {
        return true; // Skip if dates missing
      }
      const daysDiff = Math.floor(
        (val.availabilityEndDate.getTime() - val.availabilityStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysDiff >= val.minStayDays;
    },
    'minStayDays',
    'Date range must be at least the minimum stay duration',
    (val) => val.rentalKind === HousingRentalKind.TEMPORARY
  );

  minStayRule(val, ctx);
}
```

### Available Rule Builders

```typescript
// Require a field to be non-null
createRequiredRule('fieldName', 'Error message', optionalCondition);

// Require a field to be null
createMustBeNullRule('fieldName', 'Error message', condition);

// Require a specific value
createValueRule('fieldName', expectedValue, 'Error message', optionalCondition);

// Date range validation
createDateRangeRule('startField', 'endField', 'Error message', optionalCondition);

// Custom validation logic
createCustomRule(validateFn, 'fieldPath', 'Error message', optionalCondition);
```

---

## 🧪 Testing Your Changes

### 1. TypeScript Compilation

```bash
npm run typecheck
```

### 2. Test in Browser

1. Start dev server: `npm run dev`
2. Navigate to housing ad creation form
3. Test both TEMPORARY and PERMANENT flows
4. Verify error messages appear correctly
5. Try to submit with invalid data

### 3. Test Edge Cases

- Switch between TEMPORARY ↔ PERMANENT
- Leave required fields empty
- Enter invalid values
- Test conditional fields (e.g., agency fee only when toggle is on)

---

## 📊 Validation Flow Diagram

```
User fills form step by step
         ↓
Step N validation (step1Schema, step2Schema, etc.)
         ↓
User can proceed if step valid
         ↓
... repeat for all steps ...
         ↓
User reaches review (step 8)
         ↓
Submit → pruneHousingValuesForBranch()
         ↓
Full validation → housingSchema.parse()
         ↓
Submit to backend
```

---

## 🎓 Key Concepts

### 1. **Incremental Validation**

Each step validates only its fields, allowing users to progress through the form without filling everything.

### 2. **Discriminated Unions**

The `rentalKind` field acts as a discriminator. Zod uses it to determine which validation rules apply.

### 3. **Auto-Transformation**

`.transform()` automatically sets dependent fields (like `priceType`) based on business rules.

### 4. **Conditional Validation**

Rules check `rentalKind` first, then apply type-specific validation:

```typescript
if (val.rentalKind === HousingRentalKind.TEMPORARY) {
  // TEMPORARY-specific rules
} else {
  // PERMANENT-specific rules
}
```

### 5. **Field Pruning**

Before submission, `pruneHousingValuesForBranch()` removes fields that don't apply to the selected rental kind.

---

## 🚨 Common Gotchas

### 1. **Don't Forget to Update STEP_FIELDS**

When adding a field to a step schema, also add it to `STEP_FIELDS` so React Hook Form watches it.

### 2. **Update Both Validators**

If a rule applies to both TEMPORARY and PERMANENT, update both `validateTemporaryPricing()` and `validatePermanentPricing()`.

### 3. **Add to Prune Function**

New fields must be handled in `pruneHousingValuesForBranch()` to clear inapplicable values.

### 4. **Update TypeScript Interfaces**

When adding fields, update the corresponding interfaces in `types.ts` for type safety.

### 5. **Use Correct Error Path**

The `path` in `ctx.addIssue()` must match the field name exactly for errors to appear correctly.

---

## 📚 Configuration Reference

### VALIDATION_MESSAGES (`validation-messages.ts`)

All error messages in one place. Use these instead of inline strings:

```typescript
VALIDATION_MESSAGES.PRICE.REQUIRED_WHEN_NOT_NEGOTIABLE;
VALIDATION_MESSAGES.DEPOSIT.NOT_APPLICABLE_TEMPORARY;
VALIDATION_MESSAGES.DATE.END_REQUIRED;
// etc.
```

### HOUSING_VALIDATION_CONFIG (`validation-config.ts`)

Declarative configuration for field requirements:

```typescript
HOUSING_VALIDATION_CONFIG.TEMPORARY.pricing.requiredFields;
HOUSING_VALIDATION_CONFIG.TEMPORARY.pricing.nullFields;
HOUSING_VALIDATION_CONFIG.PERMANENT.pricing.requiredFields;
// etc.
```

### validationUtils (`utils.ts`)

Pure functions for business logic:

```typescript
validationUtils.isPriceValid(amount, negotiable);
validationUtils.isAgencyFeeValid(hasAgencyFee, amount);
validationUtils.isBillsEstimateRequired(policy);
validationUtils.isDateRangeValid(start, end);
```

---

## 🔄 Modification Patterns

### Pattern 1: Add a New Required Field

1. Add to base schema (optional/nullable)
2. Add error message
3. Add validation in appropriate function
4. Add to step schema `.pick()`
5. Add to `STEP_FIELDS`
6. Update TypeScript interface

### Pattern 2: Change Validation Logic

1. Locate the validation function (e.g., `validateTemporaryPricing`)
2. Modify the condition
3. Update error message if needed
4. Test both TEMPORARY and PERMANENT flows

### Pattern 3: Add Conditional Field

1. Add to base schema (nullable)
2. Add validation that checks condition first
3. Add to prune function (clear when condition is false)
4. Update TypeScript interface

### Pattern 4: Add Cross-Field Validation

1. Use `.superRefine()` instead of `.refine()`
2. Access multiple fields in validation function
3. Add error to appropriate field path

---

## ✅ Checklist for Adding/Modifying Rules

- [ ] Updated `types.ts` with new interface fields
- [ ] Added error messages to `validation-messages.ts`
- [ ] Updated base schema in `index.ts`
- [ ] Added validation logic in appropriate function
- [ ] Updated step schema `.pick()` to include field
- [ ] Added field to `STEP_FIELDS` mapping
- [ ] Updated `pruneHousingValuesForBranch()` if needed
- [ ] Ran `npm run typecheck` (no errors)
- [ ] Tested in browser (TEMPORARY flow)
- [ ] Tested in browser (PERMANENT flow)
- [ ] Verified error messages display correctly
- [ ] Updated documentation if needed

---

## 📖 Example: Complete Rule Addition

See the "Add Minimum Stay Duration" example above for a complete walkthrough.

---

## 🆘 Need Help?

1. **Find the validation**: Check which `applyStepXRules()` function handles your field
2. **Check types**: Look at `types.ts` for field types and interfaces
3. **Check messages**: Look at `validation-messages.ts` for available messages
4. **Follow the pattern**: Copy an existing similar validation rule
5. **Test thoroughly**: Test both rental kinds and all edge cases

---

## 🎯 Summary

**To add/modify validation:**

1. **Identify the step**: Which step is the field in?
2. **Update types**: Add to interfaces in `types.ts`
3. **Add message**: Add to `validation-messages.ts`
4. **Update schema**: Add field to base schema
5. **Add validation**: Update validation function
6. **Update step schema**: Add to `.pick()` and `STEP_FIELDS`
7. **Update prune**: Handle in `pruneHousingValuesForBranch()`
8. **Test**: Run typecheck and test in browser

**Files to modify (in order):**

1. `types.ts` → 2. `validation-messages.ts` → 3. `index.ts` (all changes) → 4. Test!

---

This architecture ensures:
✅ Type safety
✅ Maintainability
✅ Testability
✅ Clear separation of concerns
✅ Easy to extend

**Happy validating! 🚀**
