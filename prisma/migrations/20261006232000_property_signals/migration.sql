ALTER TABLE "Parcel" ADD COLUMN "lifeEstate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Parcel" ADD COLUMN "listed" BOOLEAN;
ALTER TABLE "Parcel" ADD COLUMN "listingUrl" TEXT;
ALTER TABLE "Parcel" ADD COLUMN "listingPrice" DOUBLE PRECISION;

ALTER TABLE "Constraints" ADD COLUMN "spatialChecked" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Parcel_totalAssessedValue_idx" ON "Parcel"("totalAssessedValue");
CREATE INDEX "Parcel_lifeEstate_idx" ON "Parcel"("lifeEstate");
CREATE INDEX "Parcel_listed_idx" ON "Parcel"("listed");
