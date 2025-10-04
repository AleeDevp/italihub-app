// Unified enums access
// - Types: from Prisma client type exports (server-only imports like DAL/actions can import these types directly)
// - Values: from generated enums (safe for client components)

export type {
  AdCategory,
  AdStatus,
  BillsPolicy,
  Country,
  ExchangeMode,
  ExchangeRateType,
  ExchangeSide,
  GenderPreference,
  HeatingType,
  HouseholdGender,
  HousingContractType,
  HousingPriceType,
  HousingPropertyType,
  HousingRentalKind,
  HousingRoomType,
  HousingUnitType,
  MarketplaceCondition,
  MediaKind,
  MediaRole,
  ModerationActionType,
  ModerationReasonCode,
  ModerationTargetType,
  ReportReason,
  ReportStatus,
  ServiceCategory,
  ServiceRateBasis,
  SettlementMethod,
  TransportDirection,
  TransportPriceMode,
  VerificationFileRole,
  VerificationMethod,
  VerificationRejectionCode,
  VerificationStatus,
  Weekday,
} from '@/generated/prisma';

export * as Enum from '@/generated/enums';

// Convenience helpers
export const valuesOf = <T extends Record<string, string | number>>(e: T) =>
  Object.values(e) as unknown as ReadonlyArray<T[keyof T]>;

export const humanize = (v: string) =>
  v
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

export const toOptions = (e: Record<string, string>) =>
  valuesOf(e as any as Record<string, string>).map((v) => ({
    value: v,
    label: humanize(String(v)),
  }));
