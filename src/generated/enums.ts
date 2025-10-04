export const UserRole = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export const AdCategory = {
  HOUSING: 'HOUSING',
  TRANSPORTATION: 'TRANSPORTATION',
  MARKETPLACE: 'MARKETPLACE',
  CURRENCY: 'CURRENCY',
  SERVICES: 'SERVICES',
} as const

export type AdCategory = typeof AdCategory[keyof typeof AdCategory]

export const AdStatus = {
  PENDING: 'PENDING',
  ONLINE: 'ONLINE',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const

export type AdStatus = typeof AdStatus[keyof typeof AdStatus]

export const MarketplaceCondition = {
  NEW: 'NEW',
  LIKE_NEW: 'LIKE_NEW',
  USED: 'USED',
  HANDMADE: 'HANDMADE',
} as const

export type MarketplaceCondition =
  typeof MarketplaceCondition[keyof typeof MarketplaceCondition]

export const MediaRole = {
  GALLERY: 'GALLERY',
  POSTER: 'POSTER',
} as const

export type MediaRole = typeof MediaRole[keyof typeof MediaRole]

export const MediaKind = {
  IMAGE: 'IMAGE',
} as const

export type MediaKind = typeof MediaKind[keyof typeof MediaKind]

export const HousingRentalKind = {
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT',
} as const

export type HousingRentalKind =
  typeof HousingRentalKind[keyof typeof HousingRentalKind]

export const HousingUnitType = {
  WHOLE_APARTMENT: 'WHOLE_APARTMENT',
  ROOM: 'ROOM',
  BED: 'BED',
} as const

export type HousingUnitType =
  typeof HousingUnitType[keyof typeof HousingUnitType]

export const HousingPropertyType = {
  STUDIO: 'STUDIO',
  BILOCALE: 'BILOCALE',
  TRILOCALE: 'TRILOCALE',
  QUADRILOCALE: 'QUADRILOCALE',
  OTHER: 'OTHER',
} as const

export type HousingPropertyType =
  typeof HousingPropertyType[keyof typeof HousingPropertyType]

export const HousingRoomType = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  TRIPLE: 'TRIPLE',
} as const

export type HousingRoomType =
  typeof HousingRoomType[keyof typeof HousingRoomType]

export const HousingContractType = {
  NONE: 'NONE',
  SHORT_TERM: 'SHORT_TERM',
  LONG_TERM: 'LONG_TERM',
} as const

export type HousingContractType =
  typeof HousingContractType[keyof typeof HousingContractType]

export const HousingPriceType = {
  MONTHLY: 'MONTHLY',
  DAILY: 'DAILY',
} as const

export type HousingPriceType =
  typeof HousingPriceType[keyof typeof HousingPriceType]

export const BillsPolicy = {
  INCLUDED: 'INCLUDED',
  EXCLUDED: 'EXCLUDED',
  PARTIAL: 'PARTIAL',
} as const

export type BillsPolicy = typeof BillsPolicy[keyof typeof BillsPolicy]

export const HouseholdGender = {
  MIXED: 'MIXED',
  FEMALE_ONLY: 'FEMALE_ONLY',
  MALE_ONLY: 'MALE_ONLY',
  UNKNOWN: 'UNKNOWN',
} as const

export type HouseholdGender =
  typeof HouseholdGender[keyof typeof HouseholdGender]

export const GenderPreference = {
  ANY: 'ANY',
  FEMALE_ONLY: 'FEMALE_ONLY',
  MALE_ONLY: 'MALE_ONLY',
} as const

export type GenderPreference =
  typeof GenderPreference[keyof typeof GenderPreference]

export const HeatingType = {
  CENTRAL: 'CENTRAL',
  INDEPENDENT: 'INDEPENDENT',
  NONE: 'NONE',
  UNKNOWN: 'UNKNOWN',
} as const

export type HeatingType = typeof HeatingType[keyof typeof HeatingType]

export const TransportDirection = {
  ITALY_TO_IRAN: 'ITALY_TO_IRAN',
  IRAN_TO_ITALY: 'IRAN_TO_ITALY',
} as const

export type TransportDirection =
  typeof TransportDirection[keyof typeof TransportDirection]

export const Country = {
  ITALY: 'ITALY',
  IRAN: 'IRAN',
} as const

export type Country = typeof Country[keyof typeof Country]

export const TransportPriceMode = {
  NEGOTIABLE: 'NEGOTIABLE',
  PER_KG: 'PER_KG',
  FIXED_TOTAL: 'FIXED_TOTAL',
} as const

export type TransportPriceMode =
  typeof TransportPriceMode[keyof typeof TransportPriceMode]

export const ServiceCategory = {
  COOKING: 'COOKING',
  REPAIRS: 'REPAIRS',
  CLEANING: 'CLEANING',
  TUTORING: 'TUTORING',
  TRANSLATION: 'TRANSLATION',
  BEAUTY: 'BEAUTY',
  IT_HELP: 'IT_HELP',
  MOVING: 'MOVING',
  DELIVERY: 'DELIVERY',
  OTHER: 'OTHER',
} as const

export type ServiceCategory =
  typeof ServiceCategory[keyof typeof ServiceCategory]

export const ServiceRateBasis = {
  HOURLY: 'HOURLY',
  FIXED: 'FIXED',
  PER_TASK: 'PER_TASK',
} as const

export type ServiceRateBasis =
  typeof ServiceRateBasis[keyof typeof ServiceRateBasis]

export const Weekday = {
  MON: 'MON',
  TUE: 'TUE',
  WED: 'WED',
  THU: 'THU',
  FRI: 'FRI',
  SAT: 'SAT',
  SUN: 'SUN',
} as const

export type Weekday = typeof Weekday[keyof typeof Weekday]

export const ExchangeSide = {
  BUY_EUR: 'BUY_EUR',
  SELL_EUR: 'SELL_EUR',
} as const

export type ExchangeSide = typeof ExchangeSide[keyof typeof ExchangeSide]

export const ExchangeRateType = {
  MARKET: 'MARKET',
  CUSTOM: 'CUSTOM',
  NEGOTIABLE: 'NEGOTIABLE',
} as const

export type ExchangeRateType =
  typeof ExchangeRateType[keyof typeof ExchangeRateType]

export const ExchangeMode = {
  IN_PERSON: 'IN_PERSON',
  ONLINE: 'ONLINE',
  EITHER: 'EITHER',
} as const

export type ExchangeMode = typeof ExchangeMode[keyof typeof ExchangeMode]

export const SettlementMethod = {
  REVOLUT: 'REVOLUT',
  PAYPAL: 'PAYPAL',
  BONIFICO_SEPA: 'BONIFICO_SEPA',
  CASH_IN_PERSON: 'CASH_IN_PERSON',
  OTHER: 'OTHER',
} as const

export type SettlementMethod =
  typeof SettlementMethod[keyof typeof SettlementMethod]

export const VerificationMethod = {
  LANDMARK_SELFIE: 'LANDMARK_SELFIE',
  STUDENT_CARD: 'STUDENT_CARD',
  IDENTITA: 'IDENTITA',
  PERMESSO: 'PERMESSO',
  RENTAL_CONTRACT: 'RENTAL_CONTRACT',
  OTHER: 'OTHER',
} as const

export type VerificationMethod =
  typeof VerificationMethod[keyof typeof VerificationMethod]

export const VerificationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type VerificationStatus =
  typeof VerificationStatus[keyof typeof VerificationStatus]

export const VerificationFileRole = {
  IMAGE: 'IMAGE',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER',
} as const

export type VerificationFileRole =
  typeof VerificationFileRole[keyof typeof VerificationFileRole]

export const VerificationRejectionCode = {
  INSUFFICIENT_PROOF: 'INSUFFICIENT_PROOF',
  CITY_MISMATCH: 'CITY_MISMATCH',
  EXPIRED_DOCUMENT: 'EXPIRED_DOCUMENT',
  UNREADABLE: 'UNREADABLE',
  OTHER: 'OTHER',
} as const

export type VerificationRejectionCode =
  typeof VerificationRejectionCode[keyof typeof VerificationRejectionCode]

export const ModerationTargetType = {
  AD: 'AD',
  VERIFICATION: 'VERIFICATION',
  REPORT: 'REPORT',
} as const

export type ModerationTargetType =
  typeof ModerationTargetType[keyof typeof ModerationTargetType]

export const ModerationActionType = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  EXPIRE: 'EXPIRE',
  RESTORE: 'RESTORE',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
  EDIT_NOTE: 'EDIT_NOTE',
  FLAG: 'FLAG',
  UNFLAG: 'UNFLAG',
  CLOSE: 'CLOSE',
  DISMISS: 'DISMISS',
} as const

export type ModerationActionType =
  typeof ModerationActionType[keyof typeof ModerationActionType]

export const ModerationReasonCode = {
  OFF_TOPIC: 'OFF_TOPIC',
  WRONG_CATEGORY: 'WRONG_CATEGORY',
  INCOMPLETE_DETAILS: 'INCOMPLETE_DETAILS',
  SPAM: 'SPAM',
  SCAM_FRAUD: 'SCAM_FRAUD',
  PROHIBITED_ITEM: 'PROHIBITED_ITEM',
  DUPLICATE: 'DUPLICATE',
  EXPIRED: 'EXPIRED',
  OTHER: 'OTHER',
} as const

export type ModerationReasonCode =
  typeof ModerationReasonCode[keyof typeof ModerationReasonCode]

export const ReportStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus]

export const ReportReason = {
  SCAM_FRAUD: 'SCAM_FRAUD',
  WRONG_CATEGORY: 'WRONG_CATEGORY',
  OFFENSIVE_CONTENT: 'OFFENSIVE_CONTENT',
  PROHIBITED_ITEM: 'PROHIBITED_ITEM',
  DUPLICATE: 'DUPLICATE',
  MISLEADING: 'MISLEADING',
  SPAM: 'SPAM',
  OTHER: 'OTHER',
} as const

export type ReportReason = typeof ReportReason[keyof typeof ReportReason]

export const ReportOutcome = {
  NO_ACTION: 'NO_ACTION',
  AD_REMOVED: 'AD_REMOVED',
  AD_EDITED: 'AD_EDITED',
  USER_WARNED: 'USER_WARNED',
  OTHER: 'OTHER',
} as const

export type ReportOutcome = typeof ReportOutcome[keyof typeof ReportOutcome]

export const NotificationType = {
  AD_EVENT: 'AD_EVENT',
  VERIFICATION_EVENT: 'VERIFICATION_EVENT',
  REPORT_EVENT: 'REPORT_EVENT',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
} as const

export type NotificationType =
  typeof NotificationType[keyof typeof NotificationType]

export const NotificationSeverity = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const

export type NotificationSeverity =
  typeof NotificationSeverity[keyof typeof NotificationSeverity]

export const AnnouncementScope = {
  GLOBAL: 'GLOBAL',
  CITY: 'CITY',
} as const

export type AnnouncementScope =
  typeof AnnouncementScope[keyof typeof AnnouncementScope]

export const AnnouncementAudience = {
  ALL_USERS: 'ALL_USERS',
  VERIFIED_ONLY: 'VERIFIED_ONLY',
  MODS_ADMINS: 'MODS_ADMINS',
} as const

export type AnnouncementAudience =
  typeof AnnouncementAudience[keyof typeof AnnouncementAudience]

export const AnnouncementSeverity = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const

export type AnnouncementSeverity =
  typeof AnnouncementSeverity[keyof typeof AnnouncementSeverity]

export const AuditOutcome = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const

export type AuditOutcome = typeof AuditOutcome[keyof typeof AuditOutcome]

export const AuditActorRole = {
  USER: 'USER',
  VERIFIED_USER: 'VERIFIED_USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM',
} as const

export type AuditActorRole = typeof AuditActorRole[keyof typeof AuditActorRole]

export const AuditEntityType = {
  AD: 'AD',
  AD_HOUSING: 'AD_HOUSING',
  AD_TRANSPORTATION: 'AD_TRANSPORTATION',
  AD_MARKETPLACE: 'AD_MARKETPLACE',
  AD_SERVICE: 'AD_SERVICE',
  AD_EXCHANGE: 'AD_EXCHANGE',
  USER: 'USER',
  MODERATION_ACTION: 'MODERATION_ACTION',
  VERIFICATION_REQUEST: 'VERIFICATION_REQUEST',
  VERIFICATION_FILE: 'VERIFICATION_FILE',
  AD_REPORT: 'AD_REPORT',
  REPORT_FILE: 'REPORT_FILE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  NOTIFICATION: 'NOTIFICATION',
  POSTING_POLICY: 'POSTING_POLICY',
  POLICY_ACCEPTANCE: 'POLICY_ACCEPTANCE',
  MEDIA_ASSET: 'MEDIA_ASSET',
  CITY: 'CITY',
  OTHER: 'OTHER',
} as const

export type AuditEntityType =
  typeof AuditEntityType[keyof typeof AuditEntityType]

export const AuditAction = {
  REGISTER: 'REGISTER',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_CONFIRM: 'PASSWORD_RESET_CONFIRM',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  EMAIL_CHANGE_REQUEST: 'EMAIL_CHANGE_REQUEST',
  EMAIL_CHANGE_CONFIRM: 'EMAIL_CHANGE_CONFIRM',
  OAUTH_LINK_GOOGLE: 'OAUTH_LINK_GOOGLE',
  OAUTH_UNLINK_GOOGLE: 'OAUTH_UNLINK_GOOGLE',
  OAUTH_LINK_FACEBOOK: 'OAUTH_LINK_FACEBOOK',
  OAUTH_UNLINK_FACEBOOK: 'OAUTH_UNLINK_FACEBOOK',
  SESSION_REVOKE_ALL: 'SESSION_REVOKE_ALL',
  ACCOUNT_DELETE_REQUEST: 'ACCOUNT_DELETE_REQUEST',
  ACCOUNT_DELETE: 'ACCOUNT_DELETE',
  PROFILE_COMPLETE: 'PROFILE_COMPLETE',
  PROFILE_EDIT: 'PROFILE_EDIT',
  PROFILE_NAME_EDIT: 'PROFILE_NAME_EDIT',
  PROFILE_USERID_EDIT: 'PROFILE_USERID_EDIT',
  PROFILE_TELEGRAMID_EDIT: 'PROFILE_TELEGRAMID_EDIT',
  PROFILE_PHOTO_CHANGE: 'PROFILE_PHOTO_CHANGE',
  PROFILE_PHOTO_DELETE: 'PROFILE_PHOTO_DELETE',
  CITY_CHANGE: 'CITY_CHANGE',
  ROLE_ASSIGN: 'ROLE_ASSIGN',
  ROLE_REVOKE: 'ROLE_REVOKE',
  VERIFICATION_SUBMIT: 'VERIFICATION_SUBMIT',
  VERIFICATION_FILE_UPLOAD: 'VERIFICATION_FILE_UPLOAD',
  VERIFICATION_FILE_DELETE: 'VERIFICATION_FILE_DELETE',
  VERIFICATION_APPROVE: 'VERIFICATION_APPROVE',
  VERIFICATION_REJECT: 'VERIFICATION_REJECT',
  VERIFICATION_REVOKE: 'VERIFICATION_REVOKE',
  VERIFICATION_ACCESS: 'VERIFICATION_ACCESS',
  AD_CREATE: 'AD_CREATE',
  AD_EDIT: 'AD_EDIT',
  AD_RENEW: 'AD_RENEW',
  AD_DELETE: 'AD_DELETE',
  AD_SUBMIT_FOR_REVIEW: 'AD_SUBMIT_FOR_REVIEW',
  AD_MEDIA_UPLOAD: 'AD_MEDIA_UPLOAD',
  AD_MEDIA_DELETE: 'AD_MEDIA_DELETE',
  AD_MEDIA_REORDER: 'AD_MEDIA_REORDER',
  AD_COVER_SET: 'AD_COVER_SET',
  AD_CONTACT_REVEAL: 'AD_CONTACT_REVEAL',
  AD_APPROVE: 'AD_APPROVE',
  AD_REJECT: 'AD_REJECT',
  AD_EXPIRE: 'AD_EXPIRE',
  AD_RESTORE: 'AD_RESTORE',
  AD_STATUS_SET: 'AD_STATUS_SET',
  REPORT_SUBMIT: 'REPORT_SUBMIT',
  REPORT_FILE_UPLOAD: 'REPORT_FILE_UPLOAD',
  REPORT_FILE_DELETE: 'REPORT_FILE_DELETE',
  REPORT_FLAG: 'REPORT_FLAG',
  REPORT_UNFLAG: 'REPORT_UNFLAG',
  REPORT_CLOSE: 'REPORT_CLOSE',
  REPORT_DISMISS: 'REPORT_DISMISS',
  NOTIFICATION_CREATE: 'NOTIFICATION_CREATE',
  NOTIFICATION_MARK_READ: 'NOTIFICATION_MARK_READ',
  NOTIFICATION_MARK_ALL_READ: 'NOTIFICATION_MARK_ALL_READ',
  ANNOUNCEMENT_CREATE: 'ANNOUNCEMENT_CREATE',
  ANNOUNCEMENT_UPDATE: 'ANNOUNCEMENT_UPDATE',
  ANNOUNCEMENT_DELETE: 'ANNOUNCEMENT_DELETE',
  ANNOUNCEMENT_PIN: 'ANNOUNCEMENT_PIN',
  ANNOUNCEMENT_UNPIN: 'ANNOUNCEMENT_UNPIN',
  ANNOUNCEMENT_DISMISS: 'ANNOUNCEMENT_DISMISS',
  POLICY_CREATE: 'POLICY_CREATE',
  POLICY_UPDATE: 'POLICY_UPDATE',
  POLICY_RETIRE: 'POLICY_RETIRE',
  POLICY_ACCEPT: 'POLICY_ACCEPT',
  CITY_CREATE: 'CITY_CREATE',
  CITY_UPDATE: 'CITY_UPDATE',
  CITY_ENABLE: 'CITY_ENABLE',
  CITY_DISABLE: 'CITY_DISABLE',
  CITY_SORT_UPDATE: 'CITY_SORT_UPDATE',
  EMAIL_SEND: 'EMAIL_SEND',
  SUPPORT_MESSAGE_SEND: 'SUPPORT_MESSAGE_SEND',
  SCHEDULER_EXPIRE_ADS: 'SCHEDULER_EXPIRE_ADS',
  METRICS_ROLLUP: 'METRICS_ROLLUP',
  CLEANUP_ORPHAN_MEDIA: 'CLEANUP_ORPHAN_MEDIA',
  MIGRATION_RUN: 'MIGRATION_RUN',
  BATCH_CLEANUP: 'BATCH_CLEANUP',
} as const

export type AuditAction = typeof AuditAction[keyof typeof AuditAction]
