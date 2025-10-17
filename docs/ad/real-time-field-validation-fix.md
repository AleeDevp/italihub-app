# Real-Time Field Validation Fix

## Issues Fixed

### Issue 1: Red Rings Don't Disappear After Fixing Errors

**Problem**: When a SelectableList or Input shows a red ring due to validation error, selecting a valid value doesn't clear the error and red ring remains.

**Root Cause**: Validation was only triggered when clicking "Next". Field changes didn't re-trigger validation.

**Solution**: Added `revalidateField()` function that validates a single field when its value changes.

### Issue 2: Red Rings Don't Appear on Input Fields

**Problem**: Input fields don't show red rings even when validation fails.

**Root Cause**: The Input component relies on `aria-invalid` attribute which is set by `FormControl`. The `FormControl` component uses `useFormField()` which calls `getFieldState()` to get the error. The error must exist in React Hook Form's state for this to work.

**Solution**: Same as Issue 1 - manually setting errors with `form.setError()` populates the field state that `FormControl` reads.

## Implementation

### 1. Created revalidateField Function

```typescript
const revalidateField = async (fieldName: keyof HousingFormValues) => {
  const stepSchema = getStepSchema(currentStep);
  if (!stepSchema) return;

  const result = await stepSchema.safeParseAsync(form.getValues());

  if (result.success) {
    // Entire step is valid, clear error for this field
    form.clearErrors(fieldName);
  } else {
    // Step has errors, check if THIS field has an error
    const zodErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const fieldError = zodErrors[fieldName];

    if (fieldError && fieldError.length > 0) {
      // Field still has error, set it
      form.setError(fieldName, {
        type: 'manual',
        message: fieldError[0],
      });
    } else {
      // Field is now valid, clear its error
      form.clearErrors(fieldName);
    }
  }
};
```

**How it works**:

1. Validates the entire step schema with current form values
2. If the entire step is valid → clear the field's error
3. If step has errors → check if THIS specific field has an error:
   - If yes → set the error (keep red ring)
   - If no → clear the error (remove red ring)

### 2. Updated All SelectableList Components

**Pattern Applied**:

```typescript
// BEFORE
<SelectableList
  value={field.value}
  onChange={(v) => field.onChange(v)}
  error={!!fieldState.error}
/>

// AFTER
<SelectableList
  value={field.value}
  onChange={(v) => {
    field.onChange(v);
    revalidateField('fieldName');
  }}
  error={!!fieldState.error}
/>
```

**Updated Fields**:

- Step 1: `rentalKind`, `propertyType`, `unitType`, `roomType`
- Step 2: `contractType`, `residenzaAvailable`
- Step 3: `priceType`, `hasAgencyFee`, `billsPolicy`

### 3. Updated All Input Components

**Pattern Applied**:

```typescript
// BEFORE
<Input
  {...field}
  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
/>

// AFTER
<Input
  {...field}
  onChange={(e) => {
    field.onChange(e.target.value === '' ? null : Number(e.target.value));
    revalidateField('fieldName');
  }}
/>
```

**Updated Fields**:

- Step 3: `priceAmount`, `depositAmount`, `agencyFeeAmount`, `billsMonthlyEstimate`

### 4. Passed revalidateField to Step 1 Component

```typescript
// housing-create-dialog.tsx
{currentStep === 1 && (
  <HousingDialogStep1
    control={control}
    revalidateField={revalidateField}
  />
)}

// housing-dialog-step-1.tsx
type Props = {
  control: Control<HousingFormValues>;
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
};

export function HousingDialogStep1({ control, revalidateField }: Props) {
  // ... use revalidateField in onChange handlers
}
```

## User Experience Flow

### Before Fix

1. User clicks "Next" without filling fields
2. Red rings appear on invalid fields ✅
3. User selects a value in SelectableList
4. **Red ring stays** ❌
5. User types in Input field
6. **Red ring stays** ❌
7. User must click "Next" again to see if errors cleared

### After Fix

1. User clicks "Next" without filling fields
2. Red rings appear on ALL invalid fields (both SelectableList AND Input) ✅
3. User selects a value in SelectableList
4. **Red ring disappears immediately** ✅
5. User types in Input field
6. **Red ring disappears as they type** ✅
7. Real-time feedback, no need to click "Next" again

## Why This Works

### SelectableList Red Rings

- `SelectableList` accepts `error={!!fieldState.error}` prop
- When `revalidateField()` calls `form.setError()`, the fieldState updates
- React re-renders with new fieldState
- Error styling applies: `error && 'ring-[3px] ring-destructive/20 border-destructive'`

### Input Red Rings

- `Input` has CSS: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`
- `FormControl` wraps Input and sets: `aria-invalid={!!error}`
- `FormControl` gets error from `useFormField()` hook
- `useFormField()` calls `getFieldState(fieldName)` which reads React Hook Form's state
- When `revalidateField()` calls `form.setError()`, this state updates
- `FormControl` sets `aria-invalid={true}`
- CSS styles activate, red ring appears

## Performance Considerations

**Validation on Every Change?**

- Yes, but it's optimized:
  - Only validates the current step schema (not entire form)
  - Only one field revalidates at a time
  - Zod validation is fast (synchronous type checking)
  - No network requests involved

**Is This Too Much Validation?**

- No, because:
  - Users get instant feedback (better UX)
  - Prevents frustration of clicking "Next" multiple times
  - Standard pattern in modern forms (Gmail, Google Forms, etc.)

## TypeScript Fix

The `zodErrors` type was a discriminated union, causing index signature errors:

```typescript
// WRONG (causes TS error)
const zodErrors = result.error.flatten().fieldErrors;
const fieldError = zodErrors[fieldName as string]; // ❌

// RIGHT (type assertion)
const zodErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
const fieldError = zodErrors[fieldName]; // ✅
```

## Testing Checklist

- [x] SelectableList shows red ring on validation error
- [x] SelectableList red ring disappears when valid option selected
- [x] Input shows red ring on validation error
- [x] Input red ring disappears when valid value entered
- [x] Error messages appear below invalid fields
- [x] Error messages disappear when field becomes valid
- [x] No TypeScript errors
- [x] Validation works across all 7 steps
- [x] Disabled fields don't show error state
- [x] Performance is acceptable (no lag when typing)

## Files Modified

1. **housing-create-dialog.tsx**
   - Added `revalidateField()` function
   - Updated all SelectableList `onChange` handlers
   - Updated all Input `onChange` handlers
   - Passed `revalidateField` to HousingDialogStep1
   - Fixed TypeScript type assertion for `zodErrors`

2. **housing-dialog-step-1.tsx**
   - Added `revalidateField` to Props type
   - Updated all 4 SelectableList `onChange` handlers

## Related Documentation

- `docs/ad/housing-validation-error-display-fix.md` - Initial validation display fix
- `docs/ad/why-manual-error-setting.md` - Explanation of manual validation approach
