/*
  Warnings:

  - You are about to alter the column `image` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - A unique constraint covering the columns `[userId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS citext;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "cityId" INTEGER,
ADD COLUMN     "cityLastChangedAt" TIMESTAMP(3),
ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "telegramHandle" VARCHAR(64),
ADD COLUMN     "userId" CITEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ALTER COLUMN "image" SET DATA TYPE VARCHAR(512);

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

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "public"."cities"("slug");

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "public"."cities"("name");

-- CreateIndex
CREATE INDEX "cities_region_idx" ON "public"."cities"("region");

-- CreateIndex
CREATE INDEX "cities_provinceCode_idx" ON "public"."cities"("provinceCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_userId_key" ON "public"."user"("userId");

-- CreateIndex
CREATE INDEX "user_cityId_idx" ON "public"."user"("cityId");

-- CreateIndex
CREATE INDEX "user_verified_idx" ON "public"."user"("verified");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
