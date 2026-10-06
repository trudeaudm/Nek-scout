-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "acreage" REAL,
    "landValue" REAL,
    "buildingValue" REAL,
    "totalAssessedValue" REAL,
    "yearBuilt" INTEGER,
    "propertyClass" TEXT,
    "zoning" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Parcel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerName" TEXT NOT NULL,
    "mailingAddress" TEXT NOT NULL,
    "mailingState" TEXT,
    "ownerType" TEXT NOT NULL,
    "absenteeOwner" BOOLEAN NOT NULL DEFAULT false,
    "outOfStateOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" TEXT NOT NULL,
    "lastSaleDate" DATETIME,
    "lastSalePrice" REAL,
    "ownershipYears" INTEGER,
    "transferType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transfer_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Constraints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" TEXT NOT NULL,
    "floodplain" BOOLEAN NOT NULL DEFAULT false,
    "wetlands" BOOLEAN NOT NULL DEFAULT false,
    "riverCorridor" BOOLEAN NOT NULL DEFAULT false,
    "currentUse" BOOLEAN NOT NULL DEFAULT false,
    "conservedLand" BOOLEAN NOT NULL DEFAULT false,
    "steepSlope" BOOLEAN NOT NULL DEFAULT false,
    "accessFrontageFlags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Constraints_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parcelId" TEXT NOT NULL,
    "saleLikelihoodScore" INTEGER NOT NULL DEFAULT 0,
    "flipScore" INTEGER NOT NULL DEFAULT 0,
    "rentalScore" INTEGER NOT NULL DEFAULT 0,
    "developmentScore" INTEGER NOT NULL DEFAULT 0,
    "legalComplexityScore" INTEGER NOT NULL DEFAULT 0,
    "overallOpportunityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scores_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcel_parcelId_key" ON "Parcel"("parcelId");

-- CreateIndex
CREATE INDEX "Parcel_county_idx" ON "Parcel"("county");

-- CreateIndex
CREATE INDEX "Parcel_town_idx" ON "Parcel"("town");

-- CreateIndex
CREATE INDEX "Parcel_acreage_idx" ON "Parcel"("acreage");

-- CreateIndex
CREATE INDEX "Owner_mailingState_idx" ON "Owner"("mailingState");

-- CreateIndex
CREATE INDEX "Owner_ownerType_idx" ON "Owner"("ownerType");

-- CreateIndex
CREATE INDEX "Owner_absenteeOwner_idx" ON "Owner"("absenteeOwner");

-- CreateIndex
CREATE INDEX "Owner_outOfStateOwner_idx" ON "Owner"("outOfStateOwner");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_parcelId_key" ON "Transfer"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "Constraints_parcelId_key" ON "Constraints"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "Scores_parcelId_key" ON "Scores"("parcelId");

-- CreateIndex
CREATE INDEX "Scores_overallOpportunityScore_idx" ON "Scores"("overallOpportunityScore");

-- CreateIndex
CREATE INDEX "Scores_saleLikelihoodScore_idx" ON "Scores"("saleLikelihoodScore");

-- CreateIndex
CREATE INDEX "Scores_developmentScore_idx" ON "Scores"("developmentScore");
