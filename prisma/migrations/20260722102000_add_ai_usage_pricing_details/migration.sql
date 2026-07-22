ALTER TABLE "ProjectAiUsage" ADD COLUMN "resolvedModel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectAiUsage" ADD COLUMN "inputPriceUsdPer1m" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "ProjectAiUsage" ADD COLUMN "cachedInputPriceUsdPer1m" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "ProjectAiUsage" ADD COLUMN "outputPriceUsdPer1m" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "ProjectAiUsage" ADD COLUMN "pricingSource" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectAiUsage" ADD COLUMN "pricingEffectiveFrom" TIMESTAMP(3);
ALTER TABLE "ProjectAiUsage" ADD COLUMN "pricingEffectiveUntil" TIMESTAMP(3);

CREATE INDEX "ProjectAiUsage_resolvedModel_idx" ON "ProjectAiUsage"("resolvedModel");
