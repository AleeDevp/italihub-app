# Frontend Implementation Guide - ItaliaHub

This document outlines critical considerations for frontend implementation based on the complete database schema and business rules.

## Table of Contents

- [Authentication & User Management](#authentication--user-management)
- [Profile Management & Verification](#profile-management--verification)
- [Ad Creation & Management](#ad-creation--management)
- [Media & File Handling](#media--file-handling)
- [Search & Filtering](#search--filtering)
- [Moderation & Reporting](#moderation--reporting)
- [Notifications & Announcements](#notifications--announcements)
- [Policy Management](#policy-management)
- [UI/UX Considerations](#uiux-considerations)
- [Security & Privacy](#security--privacy)
- [Performance & Optimization](#performance--optimization)

---

## Authentication & User Management

### Core User Fields

- **User ID**: String-based primary key (not auto-increment)
- **Custom userId**: Case-insensitive unique identifier (`@db.Citext`)
- **Profile Completion**: Boolean flag (`isProfileComplete`)
- **Verification Status**: Separate from email verification (`verified`, `verifiedAt`)
- **City Assignment**: Required for most features, with cooldown period

### Key Implementation Points

- **City Cooldown**: Enforce 10-day cooldown on city changes in UI
- **Profile Completion Gating**: Block certain features until profile is complete
- **Telegram Handle**: Optional field for contact purposes (64 char limit)
- **Role-Based Access**: Default "user" role with potential for admin/moderator roles

---

## Profile Management & Verification

### Verification System

- **City-Specific Verification**: Users must verify for each city separately
- **Multiple Verification Methods**:
  - `LANDMARK_SELFIE`: Selfie with recognizable city landmark
  - `STUDENT_CARD`: University ID verification
  - `IDENTITA`: Italian ID card
  - `PERMESSO`: Permesso di soggiorno
  - `RENTAL_CONTRACT`: Rental agreement
  - `OTHER`: Custom verification method

### UI Requirements

- **File Upload Interface**: Support multiple file types (documents + selfies)
- **Verification Status Display**: Clear status indicators (PENDING/APPROVED/REJECTED)
- **City Change Warning**: Alert users about verification reset when changing cities
- **Re-verification Flow**: Prompt for new verification when city changes

### Key Validations

- **Verified-Only Features**: Currency exchange requires verified status
- **Document Privacy**: Never expose storage keys publicly
- **Status Transitions**: Handle all verification states in UI

---

## Ad Creation & Management

### Category-Specific Forms

#### Housing Ads

- **Complex Form Structure**: 50+ fields across multiple sections
- **Conditional Fields**: Room details only when `unitType` ∈ {ROOM, BED}
- **Price Flexibility**: Support nullable pricing for "negotiable" cases
- **Array Fields**: Transit lines, nearby shops (string arrays)
- **Geolocation**: Optional lat/lng with street hints
- **Expiration Logic**: Auto-set to availability start date

#### Transportation Ads

- **Route Management**: Departure/arrival cities with additional pickup/delivery points
- **Item Type Arrays**: Accepted/restricted items as string arrays
- **Pricing Modes**: Negotiable, per-kg, or fixed total
- **Capacity Management**: Weight limits and minimums
- **Date Validation**: Flight date drives ad expiration

#### Marketplace Ads

- **Simple Structure**: Title, description, price, condition, category
- **Image Gallery**: Multiple images with cover selection
- **Condition Options**: NEW, LIKE_NEW, USED, HANDMADE
- **No Expiration**: Marketplace ads don't auto-expire

#### Services Ads

- **Content Focus**: Title and description are required
- **Category Selection**: Predefined service categories
- **Pricing Flexibility**: Hourly, fixed, or per-task rates
- **Availability Tracking**: Weekday arrays for availability
- **Portfolio Links**: String array for work examples
- **Optional Poster**: Single image with POSTER role

#### Currency Exchange Ads

- **Verified-Only**: Block creation for unverified users
- **Side Selection**: BUY_EUR or SELL_EUR
- **Rate Types**: Market, custom, or negotiable pricing
- **Settlement Methods**: Multiple payment options as arrays
- **Partial Amounts**: Support for partial exchanges
- **Safety Warnings**: Display security disclaimers

### Universal Ad Features

- **Status Management**: PENDING → ONLINE → EXPIRED/REJECTED flow
- **View Tracking**: Increment `viewsCount` on page views
- **Contact Tracking**: Track `contactClicksCount` for analytics
- **Media Management**: Gallery with cover image selection
- **Auto-Expiration**: Some categories auto-expire based on dates

---

## Media & File Handling

### Storage Strategy

- **Provider-Agnostic**: Store `storageKey`, build CDN URLs server-side
- **Role-Based Media**: GALLERY (default) vs POSTER (services)
- **Ordering System**: Stable ordering with unique constraints
- **Cover Selection**: O(1) cover pointer for performance

### UI Requirements

- **Drag & Drop Upload**: Modern file upload interface
- **Image Preview**: Show thumbnails during upload
- **Reordering Interface**: Allow users to reorder gallery images
- **Cover Selection**: Let users choose cover image
- **Progress Indicators**: Show upload progress
- **Error Handling**: Handle failed uploads gracefully

### File Constraints

- **Image Limits**: Enforce per-ad image limits (e.g., 12 images max)
- **File Size**: Validate file sizes before upload
- **MIME Types**: Restrict to allowed image formats
- **EXIF Stripping**: Remove metadata for privacy

---

## Search & Filtering

### Category-Specific Filters

#### Housing Filters

- **Price Range**: Min/max price with negotiable option
- **Location**: City, neighborhood, transit lines
- **Property Type**: Studio, bilocale, trilocale, etc.
- **Amenities**: Furnished, WiFi, washing machine, etc.
- **Household**: Gender preferences, household size
- **Availability**: Date range filtering

#### Transportation Filters

- **Route**: Departure/arrival countries and cities
- **Date Range**: Flight date filtering
- **Capacity**: Weight capacity ranges
- **Price**: Per-kg or fixed pricing
- **Services**: Postal forwarding, inspection acceptance

#### Marketplace Filters

- **Price Range**: Min/max pricing
- **Condition**: New, used, like new, handmade
- **Category**: Electronics, clothing, etc.
- **Location**: City-based filtering

#### Services Filters

- **Category**: Service type filtering
- **Price Range**: Rate amount filtering
- **Availability**: Day of week filtering
- **Location**: Service area filtering

#### Exchange Filters

- **Side**: BUY_EUR vs SELL_EUR
- **Amount Range**: EUR amount filtering
- **Rate Type**: Market, custom, negotiable
- **Exchange Mode**: In-person, online, either
- **Settlement Methods**: Payment method filtering

### Search Features

- **Full-Text Search**: Title and description search
- **Location-Based**: City-scoped results
- **Sort Options**: Date, price, relevance
- **Saved Searches**: User preference storage
- **Real-Time Filters**: Update results without page reload

---

## Moderation & Reporting

### Reporting System

- **Anonymous Reporting**: Support optional reporter identification
- **Evidence Upload**: Private file storage for report evidence
- **Report Reasons**: Predefined categories (SCAM_FRAUD, SPAM, etc.)
- **Status Tracking**: OPEN → CLOSED with outcomes
- **Rate Limiting**: Prevent report spam

### Moderation Interface (Admin/Mod)

- **Action Logging**: All moderation actions tracked
- **Batch Operations**: Handle multiple ads/reports efficiently
- **Context Switching**: Easy navigation between related items
- **Status Management**: Clear action buttons for approve/reject/etc.
- **Audit Trail**: Complete history of moderation actions

### User-Facing Features

- **Report Button**: Easy reporting interface on ads
- **Status Notifications**: Updates on reported content
- **Appeal Process**: Handle rejected ads
- **Transparency**: Show moderation outcomes when appropriate

---

## Notifications & Announcements

### Notification System

- **Real-Time Updates**: WebSocket or polling for live notifications
- **Deep Linking**: Navigate directly to relevant content
- **Unread Counts**: Badge counts for unread notifications
- **Severity Levels**: Visual treatment based on severity (INFO/SUCCESS/WARNING/ERROR)
- **Mark as Read**: Individual and bulk read actions
- **Notification Types**:
  - Ad events (approved, rejected, expired)
  - Verification updates
  - Report outcomes
  - System announcements

### Announcement System

- **Targeted Display**: Global vs city-specific announcements
- **Audience Filtering**: Show only relevant announcements
- **Dismissible UI**: Allow users to dismiss announcements
- **Pinned Priority**: Show pinned announcements at top
- **Time-Based**: Respect start/end date visibility
- **Rich Content**: Support deep links and JSON data

---

## Policy Management

### Policy Acceptance Flow

- **Category-Specific**: Different policies per ad category
- **Version Tracking**: Handle policy updates
- **Acceptance Gating**: Block ad creation until policy accepted
- **Context Capture**: Record IP and User-Agent for audit
- **One-Time per Version**: Don't re-prompt for same policy version

### UI Implementation

- **Modal/Overlay**: Show policy acceptance before ad creation
- **Clear Language**: Display policy content clearly
- **Checkbox Confirmation**: Explicit "I agree" action required
- **Version Notifications**: Alert users to policy changes
- **Audit Trail**: Show acceptance history in user settings

---

## UI/UX Considerations

### Responsive Design

- **Mobile-First**: Design for mobile devices primarily
- **Progressive Enhancement**: Layer desktop features
- **Touch-Friendly**: Large tap targets, swipe gestures
- **Performance**: Optimize for slower mobile connections

### Accessibility

- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Meet WCAG guidelines
- **Alt Text**: Image descriptions for media
- **Focus Management**: Clear focus indicators

### Internationalization

- **Italian Primary**: Default to Italian language
- **English Support**: Secondary language option
- **RTL Preparation**: Consider future RTL language support
- **Currency Formatting**: Proper EUR formatting
- **Date/Time**: Local Italian formatting

### User Experience

- **Progressive Disclosure**: Show complex forms in steps
- **Auto-Save**: Save draft states for long forms
- **Validation**: Real-time form validation
- **Loading States**: Clear loading indicators
- **Error Recovery**: Helpful error messages and recovery options

---

## Security & Privacy

### Data Protection

- **Private Files**: Never expose storage keys for private files
- **Signed URLs**: Generate temporary URLs server-side only
- **User Data**: Protect personal information in verification docs
- **Contact Protection**: Gate contact information behind interactions

### Input Validation

- **Client + Server**: Validate on both ends
- **SQL Injection**: Use parameterized queries
- **XSS Prevention**: Sanitize user input
- **File Upload**: Validate file types and sizes
- **Rate Limiting**: Prevent abuse of APIs

### Authentication Security

- **Session Management**: Secure session handling
- **Password Requirements**: Strong password policies
- **Two-Factor**: Consider 2FA for sensitive operations
- **Account Lockout**: Prevent brute force attacks

---

## Performance & Optimization

### Database Optimization

- **Indexed Queries**: Use database indexes effectively
- **Pagination**: Implement proper pagination for lists
- **Lazy Loading**: Load related data only when needed
- **Query Optimization**: Minimize N+1 queries
- **Caching**: Cache frequently accessed data

### Frontend Performance

- **Image Optimization**: Compress and resize images
- **Lazy Loading**: Load images and content on demand
- **Bundle Splitting**: Split JavaScript bundles
- **CDN Usage**: Serve static assets from CDN
- **Service Workers**: Cache resources for offline access

### Monitoring & Analytics

- **Error Tracking**: Monitor frontend errors
- **Performance Metrics**: Track Core Web Vitals
- **User Analytics**: Track user behavior patterns
- **A/B Testing**: Test feature variations
- **Conversion Tracking**: Monitor ad posting/contact flows

---

## Implementation Priorities

### Phase 1 - Core Features

1. User authentication and profile management
2. Basic ad creation (one category)
3. Simple search and listing
4. Basic notification system

### Phase 2 - Enhanced Features

1. All ad categories with full features
2. Media upload and management
3. Verification system
4. Advanced search and filtering

### Phase 3 - Community Features

1. Reporting and moderation tools
2. Announcement system
3. Policy management
4. Advanced notifications

### Phase 4 - Optimization

1. Performance improvements
2. Advanced analytics
3. A/B testing implementation
4. Mobile app considerations

---

## Development Best Practices

### Code Organization

- **Component Structure**: Organize by feature/domain
- **State Management**: Use appropriate state solution (Redux, Zustand, etc.)
- **Type Safety**: Implement with TypeScript
- **Testing**: Unit, integration, and E2E tests
- **Documentation**: Document complex business logic

### API Design

- **RESTful Design**: Follow REST principles
- **GraphQL Option**: Consider for complex queries
- **Versioning**: Plan for API versioning
- **Error Handling**: Consistent error response format
- **Rate Limiting**: Implement API rate limits

### Deployment

- **Environment Management**: Dev, staging, production
- **CI/CD Pipeline**: Automated testing and deployment
- **Monitoring**: Application and infrastructure monitoring
- **Backup Strategy**: Regular database backups
- **Rollback Plan**: Quick rollback procedures

---

This comprehensive guide should serve as a reference throughout the development process. Regular updates will be needed as requirements evolve and new features are added.
