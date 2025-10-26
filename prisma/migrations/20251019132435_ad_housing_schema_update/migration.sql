/*
  Warnings:

  - The values [ROOM,BED] on the enum `HousingUnitType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `roomBedsAvailable` on the `ad_housing` table. All the data in the column will be lost.
  - You are about to drop the column `roomBedsTotal` on the `ad_housing` table. All the data in the column will be lost.
  - You are about to drop the column `roomType` on the `ad_housing` table. All the data in the column will be lost.
  - You are about to drop the column `terrace` on the `ad_housing` table. All the data in the column will be lost.
  - Made the column `propertyType` on table `ad_housing` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PROFILE_NAME_EDIT';
ALTER TYPE "AuditAction" ADD VALUE 'PROFILE_USERID_EDIT';
ALTER TYPE "AuditAction" ADD VALUE 'PROFILE_TELEGRAMID_EDIT';

-- AlterEnum
BEGIN;
CREATE TYPE "HousingUnitType_new" AS ENUM ('WHOLE_APARTMENT', 'SINGLE_ROOM', 'DOUBLE_ROOM', 'TRIPLE_ROOM');
ALTER TABLE "ad_housing" ALTER COLUMN "unitType" TYPE "HousingUnitType_new" USING ("unitType"::text::"HousingUnitType_new");
ALTER TYPE "HousingUnitType" RENAME TO "HousingUnitType_old";
ALTER TYPE "HousingUnitType_new" RENAME TO "HousingUnitType";
DROP TYPE "public"."HousingUnitType_old";
COMMIT;

-- AlterTable
ALTER TABLE "ad_housing" DROP COLUMN "roomBedsAvailable",
DROP COLUMN "roomBedsTotal",
DROP COLUMN "roomType",
DROP COLUMN "terrace",
ADD COLUMN     "clothesDryer" BOOLEAN,
ADD COLUMN     "newlyRenovated" BOOLEAN,
ADD COLUMN     "numberOfBathrooms" INTEGER DEFAULT 1,
ALTER COLUMN "propertyType" SET NOT NULL,
ALTER COLUMN "furnished" DROP NOT NULL,
ALTER COLUMN "hasElevator" DROP NOT NULL,
ALTER COLUMN "privateBathroom" DROP NOT NULL,
ALTER COLUMN "kitchenEquipped" DROP NOT NULL,
ALTER COLUMN "wifi" DROP NOT NULL,
ALTER COLUMN "washingMachine" DROP NOT NULL,
ALTER COLUMN "dishwasher" DROP NOT NULL,
ALTER COLUMN "balcony" DROP NOT NULL,
ALTER COLUMN "doubleGlazedWindows" DROP NOT NULL,
ALTER COLUMN "airConditioning" DROP NOT NULL,
ALTER COLUMN "householdSize" DROP NOT NULL,
ALTER COLUMN "householdGender" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."HousingRoomType";
