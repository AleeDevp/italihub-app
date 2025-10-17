ad_housing — Field spec (1:1 with ads)

Core ad fields live in ads.
housing ads gets expire (has expiration_date).

## `ad_housing` — Final field spec (TPT; 1:1 with `ads`)

### Core

- `ad_id` — **PK**, **FK →** `ads.id` (unique 1:1)

### Rental & Unit

- `rental_kind` — **enum**: `TEMPORARY | PERMANENT`
- `unit_type` — **enum**: `WHOLE_APARTMENT | ROOM | BED`
- `property_type` — **enum**: `STUDIO | BILOCALE | TRILOCALE | QUADRILOCALE | OTHER` (nullable)

### Room Specifics _(applies when `unit_type` ∈ {ROOM, BED})_

- `room_type` — **enum**: `SINGLE | DOUBLE | TRIPLE` (nullable unless `unit_type` ∈ {ROOM, BED})
- `room_beds_total` — `Int?`
- `room_beds_available` — `Int?`

### Availability & Contract

- `availability_start_date` — `Date` (required)
- `availability_end_date` — `Date?` (typically for `TEMPORARY`)
- `contract_type` — **enum**: `NONE | SHORT_TERM | LONG_TERM`
- `residenza_available` — `Boolean`

> **Note:** Application sets `ads.expiration_date = availability_start_date`.

### Pricing

- `price_type` — **enum**: `MONTHLY | DAILY`
- `price_amount` — `Decimal(10,2)?` (**nullable** to allow “negotiable” cases)
- `price_negotiable` — `Boolean`
- `deposit_amount` — `Decimal(10,2)?`
- `agency_fee_amount` — `Decimal(10,2)?`

### Bills

- `bills_policy` — **enum**: `INCLUDED | EXCLUDED | PARTIAL`
- `bills_monthly_estimate` — `Decimal(10,2)?` (average if **EXCLUDED**/**PARTIAL**)
- `bills_notes` — `String?` (free text for seasonal/range notes)

### Property Features

- `furnished` — `Boolean`
- `floor_number` — `Int?`
- `has_elevator` — `Boolean`
- `private_bathroom` — `Boolean`
- `kitchen_equipped` — `Boolean`
- `wifi` — `Boolean`
- `washing_machine` — `Boolean`
- `dishwasher` — `Boolean`
- `balcony` — `Boolean`
- `terrace` — `Boolean`
- `heating_type` — **enum**: `CENTRAL | INDEPENDENT | NONE | UNKNOWN`
- `double_glazed_windows` — `Boolean`
- `air_conditioning` — `Boolean`

### Household (Roommates)

- `household_size` — `Int` (total people currently living there)
- `household_gender` — **enum**: `MIXED | FEMALE_ONLY | MALE_ONLY | UNKNOWN`
- `gender_preference` — **enum**: `ANY | FEMALE_ONLY | MALE_ONLY`
- `household_description` — `String?`

### Location Context

- `neighborhood` — `String?`
- `street_hint` — `String?` (e.g., “Via Pollenzo”, “near Dante metro”)
- `lat` — `Decimal(9,6)?`
- `lng` — `Decimal(9,6)?`
- `transit_lines` — `String[]?` (e.g., `{ "4","42","63","tram 4" }`)
- `shops_nearby` — `String[]?` (e.g., `{ "Lidl","In’s","Bennet" }`)

### Misc

- `notes` — `String?`

> **Images:** store in `media_assets` as multiple rows per `ad_id`. If you want a primary image later, add `cover_media_id` (FK) here.

---

## Prisma model (clean, ready to paste)

```prisma
enum HousingRentalKind { TEMPORARY PERMANENT }
enum HousingUnitType { WHOLE_APARTMENT ROOM BED }
enum HousingPropertyType { STUDIO BILOCALE TRILOCALE QUADRILOCALE OTHER }
enum HousingRoomType { SINGLE DOUBLE TRIPLE }
enum HousingContractType { NONE SHORT_TERM LONG_TERM }
enum HousingPriceType { MONTHLY DAILY }
enum BillsPolicy { INCLUDED EXCLUDED PARTIAL }
enum HouseholdGender { MIXED FEMALE_ONLY MALE_ONLY UNKNOWN }
enum GenderPreference { ANY FEMALE_ONLY MALE_ONLY }
enum HeatingType { CENTRAL INDEPENDENT NONE UNKNOWN }

model AdHousing {
  // Core
  adId                   Int     @id
  ad                     Ad      @relation(fields: [adId], references: [id], onDelete: Cascade)

  // Rental & Unit
  rentalKind             HousingRentalKind
  unitType               HousingUnitType
  propertyType           HousingPropertyType?

  // Room specifics
  roomType               HousingRoomType?
  roomBedsTotal          Int?
  roomBedsAvailable      Int?

  // Availability & contract
  availabilityStartDate  DateTime
  availabilityEndDate    DateTime?
  contractType           HousingContractType
  residenzaAvailable     Boolean

  // Pricing
  priceType              HousingPriceType
  priceAmount            Decimal?    @db.Decimal(10, 2)
  priceNegotiable        Boolean
  depositAmount          Decimal?    @db.Decimal(10, 2)
  agencyFeeAmount        Decimal?    @db.Decimal(10, 2)

  // Bills
  billsPolicy            BillsPolicy
  billsMonthlyEstimate   Decimal?    @db.Decimal(10, 2)
  billsNotes             String?

  // Property features
  furnished              Boolean
  floorNumber            Int?
  hasElevator            Boolean
  privateBathroom        Boolean
  kitchenEquipped        Boolean
  wifi                   Boolean
  washingMachine         Boolean
  dishwasher             Boolean
  balcony                Boolean
  terrace                Boolean
  heatingType            HeatingType
  doubleGlazedWindows    Boolean
  airConditioning        Boolean

  // Household
  householdSize          Int
  householdGender        HouseholdGender
  genderPreference       GenderPreference
  householdDescription   String?

  // Location
  neighborhood           String?
  streetHint             String?
  lat                    Decimal?    @db.Decimal(9, 6)
  lng                    Decimal?    @db.Decimal(9, 6)
  transitLines           String[]
  shopsNearby            String[]

  // Misc
  notes                  String?

  @@map("ad_housing")
  @@index([priceAmount])
  @@index([availabilityStartDate])
}
```

**Notes:**

- I made `transitLines` and `shopsNearby` **non-null arrays with default empty** (`String[]` in Prisma defaults to `[]`). If you prefer them truly nullable, change to `String[]?`.
- Business rules to enforce **in app logic**:
  - If `unitType` ∈ {`ROOM`,`BED`} ⇒ `roomType` required.
  - If `billsPolicy` = `INCLUDED` ⇒ `billsMonthlyEstimate` usually **null**.
  - `priceAmount` can be `null` only if `priceNegotiable = true` (optional rule).
  - On create/update ⇒ set `ads.expiration_date = availabilityStartDate`.
