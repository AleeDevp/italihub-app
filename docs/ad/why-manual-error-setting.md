# Why Manual Error Setting is Required

## The Problem

When using React Hook Form **without** a Zod resolver, the `form.trigger()` method doesn't automatically populate field errors from Zod validation schemas.

## Understanding React Hook Form Validation Modes

### With Zod Resolver (Automatic)

```typescript
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(mySchema), // Zod schema integrated
  mode: 'onSubmit',
});

// This works automatically - errors are set from Zod schema
await form.trigger('fieldName');
```

When you use `zodResolver`, React Hook Form knows how to validate fields using your Zod schema and automatically sets errors in the field state.

### Without Zod Resolver (Manual - Our Case)

```typescript
const form = useForm({
  // No resolver! Manual validation required
  mode: 'onSubmit',
});

// This does NOT set errors from Zod schema
await form.trigger('fieldName'); // ❌ Won't work as expected
```

Without a resolver, `form.trigger()` has no way to validate against Zod schemas, so it doesn't set any errors.

## Why We Can't Use a Resolver

Our housing form has **complex conditional validation** based on the rental kind (temporary vs permanent):

```typescript
housingSchema = z.discriminatedUnion('rentalKind', [
  temporaryRentalSchema, // Different validation rules
  permanentRentalSchema, // Different validation rules
]);
```

The schema uses:

- **Discriminated unions** - Different schemas for different rental types
- **Conditional transformations** - Fields that change based on rental kind
- **Cross-field validation** - Fields that depend on other field values
- **Dynamic required/optional fields** - Some fields required only for certain rental types

This complexity makes it difficult to use a standard resolver approach, so we validate **manually** using step-specific schemas.

## Our Solution: Manual Error Setting

Since we can't use a resolver, we manually bridge Zod validation results into React Hook Form:

```typescript
const goNext = async () => {
  const stepSchema = getStepSchema(currentStep);
  const result = await stepSchema.safeParseAsync(form.getValues());

  if (!result.success) {
    // Extract Zod errors
    const zodErrors = result.error.flatten().fieldErrors;

    // Manually set each error in React Hook Form
    Object.entries(zodErrors).forEach(([fieldName, messages]) => {
      if (messages && messages.length > 0) {
        form.setError(fieldName, {
          type: 'manual',
          message: messages[0],
        });
      }
    });
  }
};
```

### What This Does

1. **Validates with Zod**: `stepSchema.safeParseAsync(form.getValues())`
   - Uses our powerful Zod schemas with all their conditional logic
   - Returns a result object with success/errors

2. **Extracts Errors**: `result.error.flatten().fieldErrors`
   - Converts Zod error structure to a flat object
   - Format: `{ fieldName: ['error message 1', 'error message 2'] }`

3. **Sets Errors in RHF**: `form.setError(fieldName, { type: 'manual', message })`
   - Manually populates React Hook Form's field state
   - Each field's `fieldState.error` now contains the Zod error
   - This triggers re-renders with error indicators

4. **Clears Errors**: `form.clearErrors(fieldName)`
   - When validation passes, we clear old errors
   - Ensures clean state between steps

## The Flow

```
User clicks "Next"
       ↓
   goNext() runs
       ↓
   Zod validates step schema
       ↓
   ┌─────────────────┬─────────────────┐
   ↓                 ↓                 ↓
Success           Failure          No Schema
   ↓                 ↓                 ↓
Clear errors    Extract Zod      Go to next
   ↓             field errors         step
Go to next          ↓
  step         Set errors via
               form.setError()
                    ↓
              Components re-render
                    ↓
              Red rings appear
              Error messages show
```

## Benefits of This Approach

✅ **Full Zod Power**: We keep all our complex validation logic in Zod schemas  
✅ **Step-by-Step Validation**: Each step validates independently with appropriate schema  
✅ **Visual Feedback**: Errors show up in the UI with red rings and messages  
✅ **Type Safety**: TypeScript ensures field names match schema  
✅ **Maintainable**: Validation logic lives in schema files, not components

## Alternative Approaches (Why We Didn't Use Them)

### Option 1: Use zodResolver

**Problem**: Our discriminated union schema is too complex for straightforward resolver integration. The resolver would need to handle dynamic schema switching based on rental kind.

### Option 2: Validate on onChange

**Problem**: Would trigger validation on every keystroke, creating poor UX and performance issues.

### Option 3: Use form.trigger() with custom validation functions

**Problem**: Would duplicate Zod validation logic into React Hook Form validation functions, violating DRY principle.

## Maintenance

When adding new validation:

1. **Add/update validation in Zod schema** (`housing/index.ts`)
2. **Ensure field is in STEP_FIELDS** for the appropriate step
3. **No changes needed in goNext()** - it automatically uses the step schema

The manual error setting in `goNext()` is **generic** and works for any Zod schema structure.

## Related Code

- **Step Schemas**: `src/lib/schemas/ads/housing/index.ts`
- **goNext Function**: `src/app/(main)/dashboard/create-ad/_components/housing-create-dialog.tsx`
- **Form Field Component**: `src/components/ui/form.tsx` (sets `aria-invalid` from error state)
- **Input Styling**: `src/components/ui/input.tsx` (red ring via `aria-invalid` class)
- **SelectableList Styling**: `src/components/ui/selectable-list.tsx` (red ring via `error` prop)
