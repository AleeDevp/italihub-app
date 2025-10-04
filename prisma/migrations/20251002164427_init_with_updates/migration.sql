-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AdCategory" AS ENUM ('HOUSING', 'TRANSPORTATION', 'MARKETPLACE', 'CURRENCY', 'SERVICES');

-- CreateEnum
CREATE TYPE "public"."AdStatus" AS ENUM ('PENDING', 'ONLINE', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."MarketplaceCondition" AS ENUM ('NEW', 'LIKE_NEW', 'USED', 'HANDMADE');

-- CreateEnum
CREATE TYPE "public"."MediaRole" AS ENUM ('GALLERY', 'POSTER');

-- CreateEnum
CREATE TYPE "public"."MediaKind" AS ENUM ('IMAGE');

-- CreateEnum
CREATE TYPE "public"."HousingRentalKind" AS ENUM ('TEMPORARY', 'PERMANENT');

-- CreateEnum
CREATE TYPE "public"."HousingUnitType" AS ENUM ('WHOLE_APARTMENT', 'ROOM', 'BED');

-- CreateEnum
CREATE TYPE "public"."HousingPropertyType" AS ENUM ('STUDIO', 'BILOCALE', 'TRILOCALE', 'QUADRILOCALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."HousingRoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE');

-- CreateEnum
CREATE TYPE "public"."HousingContractType" AS ENUM ('NONE', 'SHORT_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "public"."HousingPriceType" AS ENUM ('MONTHLY', 'DAILY');

-- CreateEnum
CREATE TYPE "public"."BillsPolicy" AS ENUM ('INCLUDED', 'EXCLUDED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."HouseholdGender" AS ENUM ('MIXED', 'FEMALE_ONLY', 'MALE_ONLY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."GenderPreference" AS ENUM ('ANY', 'FEMALE_ONLY', 'MALE_ONLY');

-- CreateEnum
CREATE TYPE "public"."HeatingType" AS ENUM ('CENTRAL', 'INDEPENDENT', 'NONE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."TransportDirection" AS ENUM ('ITALY_TO_IRAN', 'IRAN_TO_ITALY');

-- CreateEnum
CREATE TYPE "public"."Country" AS ENUM ('ITALY', 'IRAN');

-- CreateEnum
CREATE TYPE "public"."TransportPriceMode" AS ENUM ('NEGOTIABLE', 'PER_KG', 'FIXED_TOTAL');

-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('COOKING', 'REPAIRS', 'CLEANING', 'TUTORING', 'TRANSLATION', 'BEAUTY', 'IT_HELP', 'MOVING', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ServiceRateBasis" AS ENUM ('HOURLY', 'FIXED', 'PER_TASK');

-- CreateEnum
CREATE TYPE "public"."Weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "public"."ExchangeSide" AS ENUM ('BUY_EUR', 'SELL_EUR');

-- CreateEnum
CREATE TYPE "public"."ExchangeRateType" AS ENUM ('MARKET', 'CUSTOM', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "public"."ExchangeMode" AS ENUM ('IN_PERSON', 'ONLINE', 'EITHER');

-- CreateEnum
CREATE TYPE "public"."SettlementMethod" AS ENUM ('REVOLUT', 'PAYPAL', 'BONIFICO_SEPA', 'CASH_IN_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VerificationMethod" AS ENUM ('LANDMARK_SELFIE', 'STUDENT_CARD', 'IDENTITA', 'PERMESSO', 'RENTAL_CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."VerificationFileRole" AS ENUM ('IMAGE', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VerificationRejectionCode" AS ENUM ('INSUFFICIENT_PROOF', 'CITY_MISMATCH', 'EXPIRED_DOCUMENT', 'UNREADABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ModerationTargetType" AS ENUM ('AD', 'VERIFICATION', 'REPORT');

-- CreateEnum
CREATE TYPE "public"."ModerationActionType" AS ENUM ('APPROVE', 'REJECT', 'EXPIRE', 'RESTORE', 'REQUEST_CHANGES', 'EDIT_NOTE', 'FLAG', 'UNFLAG', 'CLOSE', 'DISMISS');

-- CreateEnum
CREATE TYPE "public"."ModerationReasonCode" AS ENUM ('OFF_TOPIC', 'WRONG_CATEGORY', 'INCOMPLETE_DETAILS', 'SPAM', 'SCAM_FRAUD', 'PROHIBITED_ITEM', 'DUPLICATE', 'EXPIRED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('SCAM_FRAUD', 'WRONG_CATEGORY', 'OFFENSIVE_CONTENT', 'PROHIBITED_ITEM', 'DUPLICATE', 'MISLEADING', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportOutcome" AS ENUM ('NO_ACTION', 'AD_REMOVED', 'AD_EDITED', 'USER_WARNED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('AD_EVENT', 'VERIFICATION_EVENT', 'REPORT_EVENT', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "public"."NotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."AnnouncementScope" AS ENUM ('GLOBAL', 'CITY');

-- CreateEnum
CREATE TYPE "public"."AnnouncementAudience" AS ENUM ('ALL_USERS', 'VERIFIED_ONLY', 'MODS_ADMINS');

-- CreateEnum
CREATE TYPE "public"."AnnouncementSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."AuditOutcome" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "public"."AuditActorRole" AS ENUM ('USER', 'VERIFIED_USER', 'MODERATOR', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."AuditEntityType" AS ENUM ('AD', 'AD_HOUSING', 'AD_TRANSPORTATION', 'AD_MARKETPLACE', 'AD_SERVICE', 'AD_EXCHANGE', 'USER', 'MODERATION_ACTION', 'VERIFICATION_REQUEST', 'VERIFICATION_FILE', 'AD_REPORT', 'REPORT_FILE', 'ANNOUNCEMENT', 'NOTIFICATION', 'POSTING_POLICY', 'POLICY_ACCEPTANCE', 'MEDIA_ASSET', 'CITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('REGISTER', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM', 'PASSWORD_CHANGE', 'EMAIL_CHANGE_REQUEST', 'EMAIL_CHANGE_CONFIRM', 'OAUTH_LINK_GOOGLE', 'OAUTH_UNLINK_GOOGLE', 'OAUTH_LINK_FACEBOOK', 'OAUTH_UNLINK_FACEBOOK', 'SESSION_REVOKE_ALL', 'ACCOUNT_DELETE_REQUEST', 'ACCOUNT_DELETE', 'PROFILE_COMPLETE', 'PROFILE_EDIT', 'PROFILE_PHOTO_CHANGE', 'PROFILE_PHOTO_DELETE', 'CITY_CHANGE', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'VERIFICATION_SUBMIT', 'VERIFICATION_FILE_UPLOAD', 'VERIFICATION_FILE_DELETE', 'VERIFICATION_APPROVE', 'VERIFICATION_REJECT', 'VERIFICATION_REVOKE', 'VERIFICATION_ACCESS', 'AD_CREATE', 'AD_EDIT', 'AD_RENEW', 'AD_DELETE', 'AD_SUBMIT_FOR_REVIEW', 'AD_MEDIA_UPLOAD', 'AD_MEDIA_DELETE', 'AD_MEDIA_REORDER', 'AD_COVER_SET', 'AD_CONTACT_REVEAL', 'AD_APPROVE', 'AD_REJECT', 'AD_EXPIRE', 'AD_RESTORE', 'AD_STATUS_SET', 'REPORT_SUBMIT', 'REPORT_FILE_UPLOAD', 'REPORT_FILE_DELETE', 'REPORT_FLAG', 'REPORT_UNFLAG', 'REPORT_CLOSE', 'REPORT_DISMISS', 'NOTIFICATION_CREATE', 'NOTIFICATION_MARK_READ', 'NOTIFICATION_MARK_ALL_READ', 'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT_UPDATE', 'ANNOUNCEMENT_DELETE', 'ANNOUNCEMENT_PIN', 'ANNOUNCEMENT_UNPIN', 'ANNOUNCEMENT_DISMISS', 'POLICY_CREATE', 'POLICY_UPDATE', 'POLICY_RETIRE', 'POLICY_ACCEPT', 'CITY_CREATE', 'CITY_UPDATE', 'CITY_ENABLE', 'CITY_DISABLE', 'CITY_SORT_UPDATE', 'EMAIL_SEND', 'SUPPORT_MESSAGE_SEND', 'SCHEDULER_EXPIRE_ADS', 'METRICS_ROLLUP', 'CLEANUP_ORPHAN_MEDIA', 'MIGRATION_RUN', 'BATCH_CLEANUP');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" VARCHAR(512),
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "telegramHandle" VARCHAR(64),
    "cityId" INTEGER,
    "cityLastChangedAt" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "region" VARCHAR(120),
    "province" VARCHAR(120),
    "provinceCode" VARCHAR(4),
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "altNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ads" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,
    "category" "public"."AdCategory" NOT NULL,
    "status" "public"."AdStatus" NOT NULL DEFAULT 'PENDING',
    "expirationDate" TIMESTAMP(3),
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "contactClicksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coverMediaId" INTEGER,
    "mediaCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_assets" (
    "id" SERIAL NOT NULL,
    "adId" INTEGER NOT NULL,
    "kind" "public"."MediaKind" NOT NULL DEFAULT 'IMAGE',
    "role" "public"."MediaRole" NOT NULL DEFAULT 'GALLERY',
    "storageKey" VARCHAR(512) NOT NULL,
    "mimeType" VARCHAR(100),
    "checksum" VARCHAR(64),
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ad_housing" (
    "adId" INTEGER NOT NULL,
    "rentalKind" "public"."HousingRentalKind" NOT NULL,
    "unitType" "public"."HousingUnitType" NOT NULL,
    "propertyType" "public"."HousingPropertyType",
    "roomType" "public"."HousingRoomType",
    "roomBedsTotal" INTEGER,
    "roomBedsAvailable" INTEGER,
    "availabilityStartDate" TIMESTAMP(3) NOT NULL,
    "availabilityEndDate" TIMESTAMP(3),
    "contractType" "public"."HousingContractType" NOT NULL,
    "residenzaAvailable" BOOLEAN NOT NULL,
    "priceType" "public"."HousingPriceType" NOT NULL,
    "priceAmount" DECIMAL(10,2),
    "priceNegotiable" BOOLEAN NOT NULL,
    "depositAmount" DECIMAL(10,2),
    "agencyFeeAmount" DECIMAL(10,2),
    "billsPolicy" "public"."BillsPolicy" NOT NULL,
    "billsMonthlyEstimate" DECIMAL(10,2),
    "billsNotes" TEXT,
    "furnished" BOOLEAN NOT NULL,
    "floorNumber" INTEGER,
    "hasElevator" BOOLEAN NOT NULL,
    "privateBathroom" BOOLEAN NOT NULL,
    "kitchenEquipped" BOOLEAN NOT NULL,
    "wifi" BOOLEAN NOT NULL,
    "washingMachine" BOOLEAN NOT NULL,
    "dishwasher" BOOLEAN NOT NULL,
    "balcony" BOOLEAN NOT NULL,
    "terrace" BOOLEAN NOT NULL,
    "heatingType" "public"."HeatingType" NOT NULL,
    "doubleGlazedWindows" BOOLEAN NOT NULL,
    "airConditioning" BOOLEAN NOT NULL,
    "householdSize" INTEGER NOT NULL,
    "householdGender" "public"."HouseholdGender" NOT NULL,
    "genderPreference" "public"."GenderPreference" NOT NULL,
    "householdDescription" TEXT,
    "neighborhood" TEXT,
    "streetHint" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "transitLines" TEXT[],
    "shopsNearby" TEXT[],
    "notes" TEXT,

    CONSTRAINT "ad_housing_pkey" PRIMARY KEY ("adId")
);

-- CreateTable
CREATE TABLE "public"."ad_transportation" (
    "adId" INTEGER NOT NULL,
    "direction" "public"."TransportDirection" NOT NULL,
    "departureCity" TEXT NOT NULL,
    "departureCountry" "public"."Country" NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "arrivalCountry" "public"."Country" NOT NULL,
    "additionalPickupCities" TEXT[],
    "additionalDeliveryCities" TEXT[],
    "routeNotes" TEXT,
    "flightDate" TIMESTAMP(3) NOT NULL,
    "capacityKg" DECIMAL(6,2),
    "minAcceptKg" INTEGER,
    "subjectToInspection" BOOLEAN NOT NULL,
    "documentsAccepted" BOOLEAN NOT NULL,
    "acceptedItemTypes" TEXT[],
    "restrictedItemTypes" TEXT[],
    "specialCapacityNotes" TEXT,
    "offersPostalForwarding" BOOLEAN NOT NULL,
    "acceptsPostalDropoff" BOOLEAN NOT NULL,
    "postalNotes" TEXT,
    "deliveryEtaDays" INTEGER,
    "priceMode" "public"."TransportPriceMode" NOT NULL,
    "pricePerKg" DECIMAL(10,2),
    "fixedTotalPrice" DECIMAL(10,2),
    "priceNotes" TEXT,
    "termsNotes" TEXT,

    CONSTRAINT "ad_transportation_pkey" PRIMARY KEY ("adId")
);

-- CreateTable
CREATE TABLE "public"."ad_marketplace" (
    "adId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "condition" "public"."MarketplaceCondition" NOT NULL,
    "category" TEXT,

    CONSTRAINT "ad_marketplace_pkey" PRIMARY KEY ("adId")
);

-- CreateTable
CREATE TABLE "public"."ad_service" (
    "adId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "serviceCategory" "public"."ServiceCategory" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateBasis" "public"."ServiceRateBasis" NOT NULL,
    "rateAmount" DECIMAL(10,2),
    "availabilityDays" "public"."Weekday"[] DEFAULT ARRAY[]::"public"."Weekday"[],
    "serviceArea" TEXT,
    "businessName" TEXT,
    "portfolioLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ad_service_pkey" PRIMARY KEY ("adId")
);

-- CreateTable
CREATE TABLE "public"."ad_exchange" (
    "adId" INTEGER NOT NULL,
    "side" "public"."ExchangeSide" NOT NULL,
    "amountEur" DECIMAL(14,2) NOT NULL,
    "allowsPartial" BOOLEAN NOT NULL DEFAULT true,
    "minChunkEur" DECIMAL(14,2),
    "rateType" "public"."ExchangeRateType" NOT NULL,
    "rateValue" DECIMAL(18,4),
    "exchangeMode" "public"."ExchangeMode" NOT NULL,
    "settlementMethods" "public"."SettlementMethod"[],
    "otherSettlementNote" TEXT,
    "notes" TEXT,

    CONSTRAINT "ad_exchange_pkey" PRIMARY KEY ("adId")
);

-- CreateTable
CREATE TABLE "public"."verification_requests" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,
    "method" "public"."VerificationMethod" NOT NULL,
    "status" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "userNote" TEXT,
    "rejectionCode" "public"."VerificationRejectionCode",
    "rejectionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_files" (
    "id" SERIAL NOT NULL,
    "verificationId" INTEGER NOT NULL,
    "role" "public"."VerificationFileRole" NOT NULL DEFAULT 'DOCUMENT',
    "storageKey" VARCHAR(512) NOT NULL,
    "mimeType" VARCHAR(100),
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."moderation_actions" (
    "id" SERIAL NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "adId" INTEGER,
    "verificationId" INTEGER,
    "reportId" INTEGER,
    "targetType" "public"."ModerationTargetType" NOT NULL,
    "action" "public"."ModerationActionType" NOT NULL,
    "reasonCode" "public"."ModerationReasonCode",
    "reasonText" TEXT,
    "prevStatus" TEXT,
    "nextStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ad_reports" (
    "id" SERIAL NOT NULL,
    "adId" INTEGER NOT NULL,
    "reporterUserId" TEXT,
    "reason" "public"."ReportReason" NOT NULL,
    "note" TEXT,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "outcome" "public"."ReportOutcome",
    "resolutionNote" TEXT,

    CONSTRAINT "ad_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_files" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "storageKey" VARCHAR(512) NOT NULL,
    "mimeType" VARCHAR(100),
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "severity" "public"."NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "title" VARCHAR(140) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "adId" INTEGER,
    "verificationId" INTEGER,
    "reportId" INTEGER,
    "deepLink" VARCHAR(255),
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "severity" "public"."AnnouncementSeverity" NOT NULL DEFAULT 'INFO',
    "scope" "public"."AnnouncementScope" NOT NULL,
    "cityId" INTEGER,
    "audience" "public"."AnnouncementAudience" NOT NULL DEFAULT 'ALL_USERS',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "deepLink" VARCHAR(255),
    "data" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcement_reads" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posting_policies" (
    "id" SERIAL NOT NULL,
    "category" "public"."AdCategory" NOT NULL,
    "locale" VARCHAR(8) NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL,
    "contentUrl" VARCHAR(255),
    "contentHash" VARCHAR(64),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posting_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."policy_acceptances" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "policyId" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "adId" INTEGER,

    CONSTRAINT "policy_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ad_metrics_daily" (
    "adId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "contactClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_metrics_daily_pkey" PRIMARY KEY ("adId","date")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "public"."AuditActorRole",
    "action" "public"."AuditAction" NOT NULL,
    "outcome" "public"."AuditOutcome" NOT NULL,
    "errorCode" VARCHAR(64),
    "entityType" "public"."AuditEntityType" NOT NULL,
    "entityId" INTEGER,
    "requestId" VARCHAR(64),
    "sessionId" VARCHAR(64),
    "ip" VARCHAR(45),
    "userAgent" VARCHAR(512),
    "metadata" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_userId_key" ON "public"."user"("userId");

-- CreateIndex
CREATE INDEX "user_cityId_idx" ON "public"."user"("cityId");

-- CreateIndex
CREATE INDEX "user_verified_idx" ON "public"."user"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "public"."cities"("slug");

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "public"."cities"("name");

-- CreateIndex
CREATE INDEX "cities_region_idx" ON "public"."cities"("region");

-- CreateIndex
CREATE INDEX "cities_provinceCode_idx" ON "public"."cities"("provinceCode");

-- CreateIndex
CREATE INDEX "ads_cityId_category_status_createdAt_idx" ON "public"."ads"("cityId", "category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ads_expirationDate_idx" ON "public"."ads"("expirationDate");

-- CreateIndex
CREATE INDEX "ads_userId_createdAt_idx" ON "public"."ads"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_adId_idx" ON "public"."media_assets"("adId");

-- CreateIndex
CREATE INDEX "media_assets_role_adId_order_idx" ON "public"."media_assets"("role", "adId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_adId_order_key" ON "public"."media_assets"("adId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "public"."media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "ad_housing_priceAmount_idx" ON "public"."ad_housing"("priceAmount");

-- CreateIndex
CREATE INDEX "ad_housing_availabilityStartDate_idx" ON "public"."ad_housing"("availabilityStartDate");

-- CreateIndex
CREATE INDEX "ad_transportation_flightDate_idx" ON "public"."ad_transportation"("flightDate");

-- CreateIndex
CREATE INDEX "ad_transportation_departureCountry_arrivalCountry_flightDat_idx" ON "public"."ad_transportation"("departureCountry", "arrivalCountry", "flightDate");

-- CreateIndex
CREATE INDEX "ad_transportation_departureCity_arrivalCity_idx" ON "public"."ad_transportation"("departureCity", "arrivalCity");

-- CreateIndex
CREATE INDEX "ad_marketplace_price_idx" ON "public"."ad_marketplace"("price");

-- CreateIndex
CREATE INDEX "ad_marketplace_category_idx" ON "public"."ad_marketplace"("category");

-- CreateIndex
CREATE INDEX "ad_service_serviceCategory_idx" ON "public"."ad_service"("serviceCategory");

-- CreateIndex
CREATE INDEX "ad_service_rateBasis_rateAmount_idx" ON "public"."ad_service"("rateBasis", "rateAmount");

-- CreateIndex
CREATE INDEX "ad_exchange_side_idx" ON "public"."ad_exchange"("side");

-- CreateIndex
CREATE INDEX "ad_exchange_amountEur_idx" ON "public"."ad_exchange"("amountEur");

-- CreateIndex
CREATE INDEX "verification_requests_userId_status_idx" ON "public"."verification_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "verification_requests_cityId_status_idx" ON "public"."verification_requests"("cityId", "status");

-- CreateIndex
CREATE INDEX "verification_requests_status_submittedAt_idx" ON "public"."verification_requests"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "verification_files_verificationId_idx" ON "public"."verification_files"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_files_storageKey_key" ON "public"."verification_files"("storageKey");

-- CreateIndex
CREATE INDEX "moderation_actions_actorUserId_createdAt_idx" ON "public"."moderation_actions"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_actions_targetType_createdAt_idx" ON "public"."moderation_actions"("targetType", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_actions_adId_idx" ON "public"."moderation_actions"("adId");

-- CreateIndex
CREATE INDEX "moderation_actions_verificationId_idx" ON "public"."moderation_actions"("verificationId");

-- CreateIndex
CREATE INDEX "moderation_actions_reportId_idx" ON "public"."moderation_actions"("reportId");

-- CreateIndex
CREATE INDEX "ad_reports_adId_status_createdAt_idx" ON "public"."ad_reports"("adId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ad_reports_reporterUserId_createdAt_idx" ON "public"."ad_reports"("reporterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "report_files_reportId_idx" ON "public"."report_files"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_files_storageKey_key" ON "public"."report_files"("storageKey");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "public"."notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_adId_idx" ON "public"."notifications"("adId");

-- CreateIndex
CREATE INDEX "notifications_verificationId_idx" ON "public"."notifications"("verificationId");

-- CreateIndex
CREATE INDEX "notifications_reportId_idx" ON "public"."notifications"("reportId");

-- CreateIndex
CREATE INDEX "announcements_isActive_startsAt_endsAt_idx" ON "public"."announcements"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "announcements_scope_cityId_idx" ON "public"."announcements"("scope", "cityId");

-- CreateIndex
CREATE INDEX "announcements_pinned_idx" ON "public"."announcements"("pinned");

-- CreateIndex
CREATE INDEX "announcement_reads_userId_readAt_dismissedAt_idx" ON "public"."announcement_reads"("userId", "readAt", "dismissedAt");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcementId_userId_key" ON "public"."announcement_reads"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "posting_policies_isActive_effectiveFrom_idx" ON "public"."posting_policies"("isActive", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "posting_policies_category_locale_version_key" ON "public"."posting_policies"("category", "locale", "version");

-- CreateIndex
CREATE INDEX "policy_acceptances_userId_acceptedAt_idx" ON "public"."policy_acceptances"("userId", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acceptances_userId_policyId_key" ON "public"."policy_acceptances"("userId", "policyId");

-- CreateIndex
CREATE INDEX "ad_metrics_daily_date_idx" ON "public"."ad_metrics_daily"("date");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "public"."audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "public"."audit_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "public"."audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_requestId_idx" ON "public"."audit_logs"("requestId");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ads" ADD CONSTRAINT "ads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ads" ADD CONSTRAINT "ads_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ads" ADD CONSTRAINT "ads_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "public"."media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_assets" ADD CONSTRAINT "media_assets_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_housing" ADD CONSTRAINT "ad_housing_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_transportation" ADD CONSTRAINT "ad_transportation_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_marketplace" ADD CONSTRAINT "ad_marketplace_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_service" ADD CONSTRAINT "ad_service_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_exchange" ADD CONSTRAINT "ad_exchange_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_requests" ADD CONSTRAINT "verification_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_requests" ADD CONSTRAINT "verification_requests_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_requests" ADD CONSTRAINT "verification_requests_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_files" ADD CONSTRAINT "verification_files_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "public"."verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moderation_actions" ADD CONSTRAINT "moderation_actions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moderation_actions" ADD CONSTRAINT "moderation_actions_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moderation_actions" ADD CONSTRAINT "moderation_actions_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "public"."verification_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moderation_actions" ADD CONSTRAINT "moderation_actions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."ad_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_reports" ADD CONSTRAINT "ad_reports_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_reports" ADD CONSTRAINT "ad_reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_files" ADD CONSTRAINT "report_files_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."ad_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "public"."verification_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."ad_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcement_reads" ADD CONSTRAINT "announcement_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."policy_acceptances" ADD CONSTRAINT "policy_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."policy_acceptances" ADD CONSTRAINT "policy_acceptances_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."posting_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."policy_acceptances" ADD CONSTRAINT "policy_acceptances_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_metrics_daily" ADD CONSTRAINT "ad_metrics_daily_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
