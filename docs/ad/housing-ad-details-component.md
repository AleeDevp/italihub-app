# Housing Ad Details Component - Implementation Guide

## Overview

The `HousingAdDetails` component displays comprehensive housing advertisement information in an elegant, Airbnb-inspired layout. It's fully responsive and organized into clear, logical sections for optimal user experience.

## Features

### Core Capabilities

- **Elegant Layout**: Clean, modern design similar to Airbnb's property pages
- **Responsive Design**: Mobile-first approach with optimized layouts for all screen sizes
- **Sticky Pricing Card**: Right-side pricing information stays visible on scroll (desktop)
- **Telegram Contact Integration**: Direct contact button with Telegram deep linking
- **Smart Data Display**: Shows/hides sections based on rental type (Temporary vs Permanent)
- **Variant Support**: Multiple display variants for different contexts (manage, public, moderator)

### Visual Organization

1. **Header Section**: Property type, rental kind badge, location
2. **Left Column (2/3 width)**:
   - Property Details (type, unit, core attributes)
   - Availability (dates, contract info)
   - Features & Amenities (categorized)
   - Household Information
3. **Right Column (1/3 width, sticky)**:
   - Pricing Card
   - Contact Button (Telegram)
   - Location Quick Info

## Usage

### Basic Implementation

```tsx
import { HousingAdDetails } from '@/components/ad-details/housing-ad-details';

// In your page component
<HousingAdDetails
  ad={adData}
  variant="public"
  ownerTelegramHandle="username"
  showContactButton={true}
/>;
```

### Props Interface

```typescript
interface HousingAdDetailsProps {
  ad: AdWithHousing; // The housing ad data
  variant?: AdDetailVariant; // Display variant (optional)
  ownerTelegramHandle?: string | null; // Owner's Telegram handle
  showContactButton?: boolean; // Show/hide contact button
}
```

### Variant Types

- **`manage`**: For ad management pages (owner view)
- **`public`**: For public-facing ad listings
- **`moderator`**: For moderator panel with highlighted background

## Component Structure

### 1. Header Section

```
┌─────────────────────────────────────┐
│ [Badge] Temporary/Permanent Rental  │
├─────────────────────────────────────┤
│ Property Title (Unit · Type)        │
│ 📍 City · Neighborhood              │
│ Near: Street Hint                   │
└─────────────────────────────────────┘
```

### 2. Two-Column Layout

#### Left Column (Main Details)

```
┌──────────────────────────────────┐
│ 🏠 Property Details              │
│   - Type, Unit, Rental Kind      │
│   - Floor, Bathrooms, Heating    │
├──────────────────────────────────┤
│ 📅 Availability                  │
│   - Check-in/out dates           │
│   - Duration (temporary)         │
│   - Contract info (permanent)    │
├──────────────────────────────────┤
│ ✨ Features & Amenities          │
│   - Core Features                │
│   - Comfort & Appliances         │
├──────────────────────────────────┤
│ 👥 Household                     │
│   - Size, Gender preference      │
└──────────────────────────────────┘
```

#### Right Column (Pricing & Actions)

```
┌──────────────────────────────────┐
│ 💰 Pricing Card (STICKY)        │
│   - Price per month/night        │
│   - Deposit & Agency Fee         │
│   - Bills Information            │
│   - [Contact Owner Button]       │
├──────────────────────────────────┤
│ 📍 Location Quick Info           │
│   - City, Neighborhood, Near     │
└──────────────────────────────────┘
```

## Responsive Behavior

### Mobile (< 768px)

- Single column layout
- Pricing card appears at natural position (not sticky)
- Full-width sections
- Compact spacing

### Tablet (768px - 1024px)

- Single column with increased padding
- Larger text and icons
- Optimized spacing

### Desktop (> 1024px)

- Three-column grid (2:1 ratio)
- Sticky pricing card on right
- Maximum width constraint (5xl)
- Centered content

## Data Display Logic

### Temporary Rentals

- Shows check-in and check-out dates
- Displays duration in nights
- Price per night
- No contract type or bills policy

### Permanent Rentals

- Shows availability start date only
- Displays contract type and residenza info
- Price per month
- Shows deposit, agency fee, bills policy

## Styling Guidelines

### Color Palette

- **Temporary Rental**: Blue gradient (`blue-50` to `blue-100`)
- **Permanent Rental**: Emerald gradient (`emerald-50` to `emerald-100`)
- **Text**: Gray scale (`gray-500`, `gray-700`, `gray-900`)
- **Borders**: Subtle gray (`gray-100`, `gray-200`)
- **Backgrounds**: White with subtle overlays

### Typography

- **Headings**: Bold, tracking tight
- **Labels**: Uppercase, tracking wide, small size
- **Values**: Semibold, readable sizes
- **Body**: Regular weight, relaxed leading

### Spacing

- Consistent gap sizes: 2, 3, 4, 6, 8 (Tailwind units)
- Padding: 5-6 for cards
- Margin: 4-8 between sections

## Feature Detection

The component intelligently shows/hides features:

```typescript
// Only show if feature is enabled
{housing.newlyRenovated && (
  <BooleanIndicator label="Newly Renovated" value={true} icon={...} />
)}
```

All features use the `BooleanIndicator` component which:

- Only renders if `value` is true
- Displays icon and label
- Has consistent styling
- Supports light background for grouping

## Contact Button Integration

### Telegram Deep Linking

```tsx
<Button asChild>
  <a href={`https://t.me/${ownerTelegramHandle}`} target="_blank">
    <RiTelegram2Fill /> Contact Owner
  </a>
</Button>
```

### Conditional Display

The contact button only shows when:

1. `showContactButton` prop is `true`
2. `ownerTelegramHandle` is provided and not null

## Icons & Visual Elements

### Icon Libraries Used

- **Lucide React**: MapPin, Users, ArrowRight
- **React Icons (FA6)**: FaHouse, FaClock, FaCalendar, FaEuroSign, FaPeopleRoof
- **React Icons (RI)**: RiTelegram2Fill
- **React Icons (MD)**: MdBalcony, MdBathtub, MdElevator, etc.
- **React Icons (TB)**: TbSparkles, TbAirConditioning
- **React Icons (BI)**: BiSolidWasher, BiSolidDryer

### Icon Configuration

All icons are sourced from `housing-features-config.tsx` for consistency.

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy (h1 → h3)
- ARIA-friendly button and link text
- Screen-reader friendly separators
- Keyboard navigation support

## Performance Considerations

- Uses memoized formatters
- Conditional rendering to avoid unnecessary DOM
- Optimized re-renders through proper React patterns
- Lazy icon loading from config

## Integration with Other Components

### Required Utilities

```typescript
import { cn, formatDate } from '@/lib/utils';
```

### UI Components

```typescript
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
```

### Config Files

```typescript
import {
  BathroomsIcon,
  COMFORT_AMENITIES_CHIPS,
  CORE_FEATURES_CHIPS,
  FloorIcon,
  HeatingIcon,
} from '@/constants/housing-features-config';
```

## Example Use Cases

### 1. Public Ad Page

```tsx
<HousingAdDetails
  ad={ad}
  variant="public"
  ownerTelegramHandle={ad.user.telegramHandle}
  showContactButton={true}
/>
```

### 2. Management Dashboard

```tsx
<HousingAdDetails ad={ad} variant="manage" showContactButton={false} />
```

### 3. Moderator Panel

```tsx
<HousingAdDetails
  ad={ad}
  variant="moderator"
  ownerTelegramHandle={ad.user.telegramHandle}
  showContactButton={false}
/>
```

## Future Enhancements

Potential improvements:

- [ ] Image gallery integration
- [ ] Map location preview
- [ ] Share functionality
- [ ] Save/Favorite button
- [ ] Print-friendly version
- [ ] Multiple contact methods (WhatsApp, Email)
- [ ] Translation support
- [ ] Analytics tracking

## Related Documentation

- [Housing Features Config](../housing-features-config.md)
- [Ad Details Types](./types.md)
- [Housing Form Review](./housing-dialog-step-8-review.tsx)
- [Housing Ad Card](../ad-cards/housing-ad-card.tsx)
