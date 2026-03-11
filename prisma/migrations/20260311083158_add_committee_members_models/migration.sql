-- CreateTable
CREATE TABLE "Tenure" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "designation" TEXT NOT NULL,
    "country" TEXT,
    "tenureId" TEXT NOT NULL,
    "teamTypeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenure_label_key" ON "Tenure"("label");

-- CreateIndex
CREATE INDEX "Tenure_isActive_order_idx" ON "Tenure"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TeamType_name_key" ON "TeamType"("name");

-- CreateIndex
CREATE INDEX "TeamType_isActive_order_idx" ON "TeamType"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeGroup_name_key" ON "CommitteeGroup"("name");

-- CreateIndex
CREATE INDEX "CommitteeGroup_isActive_order_idx" ON "CommitteeGroup"("isActive", "order");

-- CreateIndex
CREATE INDEX "CommitteeMember_tenureId_teamTypeId_groupId_idx" ON "CommitteeMember"("tenureId", "teamTypeId", "groupId");

-- CreateIndex
CREATE INDEX "CommitteeMember_createdById_idx" ON "CommitteeMember"("createdById");

-- CreateIndex
CREATE INDEX "CommitteeMember_isActive_order_idx" ON "CommitteeMember"("isActive", "order");

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_tenureId_fkey" FOREIGN KEY ("tenureId") REFERENCES "Tenure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_teamTypeId_fkey" FOREIGN KEY ("teamTypeId") REFERENCES "TeamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommitteeGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
