-- CreateTable
CREATE TABLE "UserWorkspaceState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "selectedStatus" TEXT NOT NULL DEFAULT 'all',
    "selectedCategory" TEXT NOT NULL DEFAULT '',
    "selectedSubcategory" TEXT NOT NULL DEFAULT '',
    "activeFilters" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "sortField" TEXT NOT NULL DEFAULT '',
    "sortDirection" TEXT NOT NULL DEFAULT '',
    "lastRequirementId" TEXT,
    "projectClosedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWorkspaceState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkspaceState_userId_scopeKey_key" ON "UserWorkspaceState"("userId", "scopeKey");

-- CreateIndex
CREATE INDEX "UserWorkspaceState_userId_idx" ON "UserWorkspaceState"("userId");

-- CreateIndex
CREATE INDEX "UserWorkspaceState_projectId_idx" ON "UserWorkspaceState"("projectId");

-- CreateIndex
CREATE INDEX "UserWorkspaceState_updatedAt_idx" ON "UserWorkspaceState"("updatedAt");

-- AddForeignKey
ALTER TABLE "UserWorkspaceState" ADD CONSTRAINT "UserWorkspaceState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkspaceState" ADD CONSTRAINT "UserWorkspaceState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
