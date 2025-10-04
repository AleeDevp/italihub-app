# Frontend Implementation Guide - ItaliaHub

This document outlines critical considerations for frontend implementation based on the complete database schema and business rules.

## Table of Contents

- [Authentication & User Management](#authentication--user-management)
- [Profile Management & Verification](#profile-management--verification)
- [City Management & Location](#city-management--location)
- [Ad Creation & Management](#ad-creation--management)
- [Media & File Handling](#media--file-handling)
- [Search & Filtering](#search--filtering)
- [Moderation & Reporting](#moderation--reporting)
- [Notifications & Announcements](#notifications--announcements)
- [Policy Management](#policy-management)
- [UI/UX Considerations](#uiux-considerations)
- [Security & Privacy](#security--privacy)
- [Performance & Optimization](#performance--optimization)
- [Analytics & Metrics](#analytics--metrics)
- [Audit Logging & Compliance](#audit-logging--compliance)

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
- **Role-Based Access**: Default "USER" role with potential for admin/moderator roles

### User Model Specifics

#### Username System (ItaliaHub ID)

- **Case-Insensitive Uniqueness**: Uses `@db.Citext` for `userId` field
- **Optional Field**: Users can choose a custom username or remain without one
- **Validation**: Check uniqueness in real-time during input
- **Fallback**: If CITEXT unavailable, store lowercase copy with unique constraint

#### City Assignment & Management

- **Required for Features**: Most platform features require city assignment
- **Cooldown Enforcement**: 10-day minimum between city changes
- **Verification Reset**: Changing city revokes verification status
- **Last Changed Tracking**: `cityLastChangedAt` field for cooldown logic

#### Profile Completion Flow

- **Multi-Step Process**: Guide users through required fields
- **Feature Gating**: Block ad posting until profile complete
- **Progress Indicators**: Show completion percentage
- **Validation**: Real-time validation for required fields

#### Contact Information

- **Telegram Integration**: Optional `telegramHandle` for communication
- **Character Limits**: 64 character limit for Telegram handles
- **Validation**: Verify Telegram handle format (@username)
- **Privacy Controls**: Let users control contact visibility

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

## City Management & Location

### City Data Structure

- **Canonical Names**: Official Italian city names (e.g., "Torino")
- **URL-Friendly Slugs**: Lowercase, hyphenated URLs (e.g., "torino")
- **Administrative Hierarchy**: Region, province, and province codes
- **Alternative Names**: Support for international spellings (e.g., "Turin" for "Torino")
- **Geographic Coordinates**: Optional lat/lng for map features

### Search & Selection Features

- **Typeahead Search**: Fast city name autocomplete
- **Multiple Name Support**: Search by official name or alternatives
- **Regional Filtering**: Filter cities by region or province
- **Popular Cities**: Manual sorting with `sortOrder` field
- **Active/Inactive States**: Hide cities without deleting data

### UI Implementation Requirements

#### City Selection Interface

- **Smart Search**: Search across `name`, `altNames`, `province`, and `region`
- **Hierarchical Display**: Show "City, Province (Region)" format
- **Map Integration**: Optional map view using lat/lng coordinates
- **Favorites**: Remember user's frequently accessed cities
- **Recent Selections**: Quick access to recently viewed cities

#### Administrative Features

- **City Status Management**: Enable/disable cities for new registrations
- **Sorting Controls**: Drag-and-drop ordering for popular cities
- **Bulk Operations**: Mass update city information
- **Data Import**: Tools for importing new city data
- **Geographic Tools**: Coordinate validation and map preview

### Data Integrity & Validation

- **Slug Generation**: Auto-generate from city names (lowercase + hyphenation)
- **Uniqueness Checks**: Prevent duplicate slugs across cities
- **Coordinate Validation**: Validate lat/lng ranges for Italy
- **Name Normalization**: Consistent capitalization and formatting
- **Province Code Validation**: Ensure valid Italian province codes

### Performance Considerations

- **Indexed Searches**: Optimize for name, region, and province queries
- **Caching Strategy**: Cache popular cities and search results
- **Lazy Loading**: Load city details on demand
- **CDN Distribution**: Cache city data across geographic regions
- **Search Optimization**: Use database full-text search capabilities

### Localization & Display

- **Primary Language**: Italian names as default
- **Alternative Spellings**: English and other language variants
- **Regional Context**: Display regional information for clarity
- **Cultural Sensitivity**: Respect local naming conventions
- **Format Consistency**: Standardized city name display formats

### Integration Points

- **User Profiles**: City assignment with cooldown enforcement
- **Ad Scoping**: All ads scoped to specific cities
- **Verification System**: City-specific verification requirements
- **Search Filtering**: City-based content filtering
- **Analytics**: City-level performance metrics

### Key Implementation Guidelines

```typescript
// City search with alternatives
const searchCities = (query: string) => {
  return cities.filter(
    (city) =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.altNames.some((alt) => alt.toLowerCase().includes(query.toLowerCase())) ||
      city.province?.toLowerCase().includes(query.toLowerCase())
  );
};

// Slug generation
const generateSlug = (cityName: string) => {
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
```

### Migration & Data Management

- **City Data Sources**: Integration with official Italian geographic databases
- **Update Procedures**: Process for adding new cities or updating information
- **Historical Data**: Maintain history of city information changes
- **Quality Assurance**: Validation procedures for city data accuracy
- **Backup Strategy**: Regular backups of city configuration data

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

## Analytics & Metrics

### Ad Performance Tracking

- **View Tracking**: Implement client-side view counting with proper throttling
- **Contact Tracking**: Track when users reveal contact information
- **Dual Counter System**:
  - Real-time counters on Ad model (`viewsCount`, `contactClicksCount`)
  - Daily bucketed metrics in `AdMetricsDaily` for analytics
- **Timezone Handling**: Always bucket to Europe/Rome timezone (00:00:00)

### Implementation Requirements

- **Bot Protection**: Ignore views without JavaScript execution
- **Access Validation**: Only count views for accessible/visible ads
- **Transaction Safety**: Use database transactions for dual updates
- **Privacy Compliance**: Don't store IP addresses in metrics (use audit logs if needed)

### Analytics Dashboard Features

- **Performance Charts**: Daily view/contact trends per ad
- **Comparative Analytics**: Compare performance across ad categories
- **Time-Range Filtering**: Support custom date ranges for analysis
- **Export Functionality**: Allow users to export their ad performance data
- **Real-Time Updates**: Show live view counts (with reasonable delays)

### Key Implementation Points

```typescript
// Example client-side tracking
const trackAdView = async (adId: number) => {
  // Throttle: only track once per user per ad per day
  const viewKey = `ad_view_${adId}_${new Date().toDateString()}`;
  if (localStorage.getItem(viewKey)) return;

  await fetch(`/api/ads/${adId}/track-view`, { method: 'POST' });
  localStorage.setItem(viewKey, 'true');
};

// Example contact reveal tracking
const trackContactReveal = async (adId: number) => {
  await fetch(`/api/ads/${adId}/track-contact`, { method: 'POST' });
};
```

### Data Retention & Performance

- **Metrics Retention**: Keep daily metrics for at least 365 days
- **Aggregation Strategy**: Consider hourly rollups for high-traffic ads
- **Query Optimization**: Use date-based indexes for fast range queries
- **Caching**: Cache aggregated metrics for dashboard performance

---

## Audit Logging & Compliance

### Comprehensive Activity Tracking

- **User Actions**: All significant user activities (login, profile changes, ad operations)
- **System Events**: Automated processes and background operations
- **Moderation Actions**: Complete audit trail of all moderation decisions
- **Administrative Operations**: Admin panel activities and bulk operations

### Action Categories & Naming

Use standardized uppercase snake-case action names:

- **Authentication**: `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`
- **Profile Management**: `PROFILE_EDIT`, `CITY_CHANGE`, `VERIFICATION_SUBMIT`
- **Ad Operations**: `AD_CREATE`, `AD_EDIT`, `AD_DELETE`, `AD_STATUS_SET`, `AD_RENEW`
- **Moderation**: `AD_APPROVE`, `AD_REJECT`, `VERIFICATION_APPROVE`, `REPORT_CLOSE`
- **System**: `BATCH_CLEANUP`, `MIGRATION_RUN`, `POLICY_UPDATE`

### Frontend Integration Points

- **Automatic Logging**: Integrate audit logging into all server actions
- **Context Capture**: Automatically capture request context (IP, User-Agent, session)
- **Error Tracking**: Log both successful and failed operations
- **Correlation IDs**: Use request IDs to trace related operations

### Implementation Strategy

```typescript
// Wrap all server actions with audit logging
export const withAudit = (action: string, entityType: AuditEntityType) => {
  return async (handler: Function) => {
    const user = await getCurrentUser();
    return withAuditLog(prisma, {
      action,
      entityType,
      actorUserId: user?.id,
      actorRole: user?.verified ? 'VERIFIED_USER' : 'USER',
    })(handler);
  };
};

// Usage in server actions
export const createAd = withAudit(
  'AD_CREATE',
  'AD'
)(async (formData) => {
  // Ad creation logic
});
```

### Privacy & Security Considerations

- **Data Sanitization**: Never log passwords, tokens, or sensitive documents
- **Metadata Limits**: Store only sanitized summaries in metadata field
- **Access Control**: Restrict audit log access to authorized personnel only
- **Retention Policy**: Implement 180-365 day retention with legal hold capabilities

### Compliance Features

- **Investigation Support**: Provide tools to trace user activities
- **Rate Limit Tuning**: Use audit data to identify and prevent abuse
- **Compliance Reporting**: Generate reports for regulatory requirements
- **Data Export**: Support audit log exports for legal proceedings

### Admin Dashboard Requirements

- **Search & Filter**: Search by user, action, date range, entity type
- **Real-Time Monitoring**: Live feed of critical system events
- **Alert System**: Notify administrators of suspicious activities
- **Visualization**: Charts showing activity patterns and trends
- **Export Tools**: CSV/JSON export for analysis and compliance

### Database Considerations

- **Append-Only**: Never update or delete audit logs in normal operations
- **Partitioning**: Consider monthly partitioning for high-volume systems
- **Indexing**: Optimize for common query patterns (user, date, action, entity)
- **Backup Strategy**: Ensure audit logs are included in backup/recovery plans

### Error Handling

- **Non-Blocking**: Audit logging failures should never break business flows
- **Retry Logic**: Implement retry mechanisms for transient failures
- **Fallback Logging**: Alternative logging when primary system fails
- **Monitoring**: Alert on audit logging system failures

### Development Guidelines

- **Consistent Integration**: Use helper functions for consistent audit logging
- **Transaction Awareness**: Log within same transaction as business operations
- **Testing**: Include audit log verification in integration tests
- **Documentation**: Document all tracked actions and their meanings

---

This comprehensive guide should serve as a reference throughout the development process. Regular updates will be needed as requirements evolve and new features are added.
