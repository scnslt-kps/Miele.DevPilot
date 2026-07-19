-- CreateTable
CREATE TABLE "ProjectRequirementAttachment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT,

    CONSTRAINT "ProjectRequirementAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequirementAttachment_storageKey_key" ON "ProjectRequirementAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "ProjectRequirementAttachment_projectId_requirementId_idx" ON "ProjectRequirementAttachment"("projectId", "requirementId");

-- CreateIndex
CREATE INDEX "ProjectRequirementAttachment_uploadedByUserId_idx" ON "ProjectRequirementAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "ProjectRequirementAttachment_uploadedAt_idx" ON "ProjectRequirementAttachment"("uploadedAt");

-- AddForeignKey
ALTER TABLE "ProjectRequirementAttachment" ADD CONSTRAINT "ProjectRequirementAttachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequirementAttachment" ADD CONSTRAINT "ProjectRequirementAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
