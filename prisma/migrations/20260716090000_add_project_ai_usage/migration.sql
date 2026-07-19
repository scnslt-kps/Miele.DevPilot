-- CreateTable
CREATE TABLE "ProjectAiUsage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedInputTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "inputCost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "outputCost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "cachedInputCost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "providerRequestId" TEXT,
    "status" TEXT NOT NULL,
    "errorType" TEXT,
    "pricingVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAiUsage_providerRequestId_key" ON "ProjectAiUsage"("providerRequestId");

-- CreateIndex
CREATE INDEX "ProjectAiUsage_projectId_idx" ON "ProjectAiUsage"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAiUsage_createdAt_idx" ON "ProjectAiUsage"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectAiUsage_action_idx" ON "ProjectAiUsage"("action");

-- CreateIndex
CREATE INDEX "ProjectAiUsage_model_idx" ON "ProjectAiUsage"("model");

-- CreateIndex
CREATE INDEX "ProjectAiUsage_projectId_createdAt_idx" ON "ProjectAiUsage"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectAiUsage" ADD CONSTRAINT "ProjectAiUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAiUsage" ADD CONSTRAINT "ProjectAiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
