# Status-Based Edit Button Implementation

## Overview

Implemented dynamic Edit button behavior in the housing ad detail page based on the ad's status. The button text, icon, state, and dialog initial step change according to the ad status.

## Implementation Details

### File Modified

- `src/app/(main)/dashboard/ads-management/[id]/_components/ad-detail-content.tsx`

### Status-Based Button Configurations

| Ad Status    | Button Text         | Icon       | Disabled | Initial Step | Behavior                                               |
| ------------ | ------------------- | ---------- | -------- | ------------ | ------------------------------------------------------ |
| **PENDING**  | "Edit"              | Edit       | ✅ Yes   | -            | Button is disabled and grayed out during review period |
| **REJECTED** | "Review & Resubmit" | Edit       | ❌ No    | -            | Opens dialog from first step for full review           |
| **EXPIRED**  | "Renew"             | RefreshCcw | ❌ No    | Step 2       | Opens dialog on Availability step for quick renewal    |
| **ONLINE**   | "Edit"              | Edit       | ❌ No    | -            | Standard edit mode from first step                     |

### Key Features

#### 1. Dynamic Button Configuration

```typescript
const getEditButtonConfig = () => {
  switch (ad.status) {
    case 'PENDING':
      return { text: 'Edit', disabled: true, icon: Edit, initialStep: undefined };
    case 'REJECTED':
      return { text: 'Review & Resubmit', disabled: false, icon: Edit, initialStep: undefined };
    case 'EXPIRED':
      return { text: 'Renew', disabled: false, icon: RefreshCcw, initialStep: 2 };
    case 'ONLINE':
    default:
      return { text: 'Edit', disabled: false, icon: Edit, initialStep: undefined };
  }
};
```

#### 2. Edit Dialog State Management

- **editDialogOpen**: Controls dialog visibility
- **editDialogInitialStep**: Stores which step to open (0-7 for housing form steps)
- **handleOpenEditDialog()**: Sets initial step before opening dialog

#### 3. Button Locations

The status-based button logic applies to TWO locations:

1. **Header Edit Button**: Top-right corner of the page
2. **Status Window Button**: Inside the status card for REJECTED and EXPIRED ads

Both buttons use the same `handleOpenEditDialog()` function with appropriate initial step.

#### 4. Visual Feedback

- **PENDING**: Gray background with 50% opacity, cursor-not-allowed
- **REJECTED/EXPIRED**: Special button styling in status window (rose-600 for REJECTED, gray-900 for EXPIRED)
- **All statuses**: Appropriate icon (Edit or RefreshCcw)

### Code Changes

#### Added State

```typescript
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editDialogInitialStep, setEditDialogInitialStep] = useState<number | undefined>(undefined);
```

#### Added Helper Function

```typescript
const handleOpenEditDialog = (initialStep?: number) => {
  setEditDialogInitialStep(initialStep);
  setEditDialogOpen(true);
};
```

#### Updated Header Button

```typescript
<Button
  variant="outline"
  className={cn(
    'gap-2',
    editButtonConfig.disabled
      ? 'opacity-50 cursor-not-allowed bg-gray-100'
      : 'hover:bg-gray-50'
  )}
  onClick={() => handleOpenEditDialog(editButtonConfig.initialStep)}
  disabled={editButtonConfig.disabled || isPendingDelete}
>
  <editButtonConfig.icon className="w-4 h-4" />
  {editButtonConfig.text}
</Button>
```

#### Updated Status Window Button

```typescript
{statusConfig.button && (
  <Button
    size="sm"
    className={cn(
      'h-9 text-sm font-medium',
      ad.status === 'REJECTED'
        ? 'bg-rose-600 hover:bg-rose-700'
        : 'bg-gray-900 hover:bg-gray-800'
    )}
    onClick={() => handleOpenEditDialog(editButtonConfig.initialStep)}
  >
    {ad.status === 'EXPIRED' ? (
      <RefreshCcw className="w-4 h-4 mr-2" />
    ) : (
      <Edit className="w-4 h-4 mr-2" />
    )}
    {statusConfig.button.label}
  </Button>
)}
```

#### Updated HousingDialog

```typescript
<HousingDialog
  mode="edit"
  initialData={ad as AdWithHousing}
  open={editDialogOpen}
  onOpenChange={setEditDialogOpen}
  initialStep={editDialogInitialStep}  // ← New prop
/>
```

## User Experience

### PENDING Status

- Edit button is **disabled and grayed out**
- User sees "Under Review" status with explanation
- Cannot modify ad until review is complete

### REJECTED Status

- Button text changes to **"Review & Resubmit"**
- Opens dialog from **first step** for complete review
- User can address rejection reasons and resubmit
- Rose-colored button in status window for visibility

### EXPIRED Status

- Button text changes to **"Renew"** with refresh icon
- Opens dialog on **Step 2 (Availability)** for quick renewal
- User can update availability dates and republish
- Gray-colored button in status window

### ONLINE Status

- Standard **"Edit"** button
- Opens dialog from **first step**
- Full edit capabilities for active ad

## Technical Notes

### Initial Step Parameter

- The `initialStep` prop is already supported by HousingDialog (line 76 in housing-dialog.tsx)
- Valid values: 0-7 (corresponding to 8 form steps)
- Step 2 = "Availability" step (perfect for renewals)

### Status Flow

1. User creates ad → **PENDING** (disabled edit, awaiting review)
2. Moderator approves → **ONLINE** (standard edit)
3. Moderator rejects → **REJECTED** (review & resubmit)
4. Ad expires → **EXPIRED** (renew with quick availability update)

### Icons Used

- **Edit**: `lucide-react` Edit icon
- **RefreshCcw**: `lucide-react` RefreshCcw icon (circular arrow for renewal)

## Testing Checklist

- [ ] PENDING ads show disabled grayed-out Edit button
- [ ] REJECTED ads show "Review & Resubmit" button
- [ ] EXPIRED ads show "Renew" button with RefreshCcw icon
- [ ] ONLINE ads show standard "Edit" button
- [ ] EXPIRED "Renew" opens dialog on Step 2 (Availability)
- [ ] Header button and status window button both work correctly
- [ ] Button properly disabled during delete operation (isPendingDelete)
- [ ] Visual feedback matches disabled state (opacity, cursor)

## Future Enhancements

1. **Add tooltip** on disabled PENDING button explaining why it's disabled
2. **Track renewal count** for expired ads
3. **Show rejection history** when opening REJECTED ad for resubmission
4. **Add confirmation dialog** when renewing expired ads
5. **Prefill new expiration date** when renewing (e.g., +30 days from today)

## Related Files

- `housing-dialog.tsx`: Multi-step form supporting initialStep parameter
- `ad-detail-content.tsx`: Main implementation file (this document)
- `ad-detail-components.tsx`: Renderer types configuration
- `housing-ad-actions.ts`: Server actions (updateHousingAdAction)
