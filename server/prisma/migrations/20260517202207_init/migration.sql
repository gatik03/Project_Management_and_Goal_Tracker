-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('NOT_STARTED', 'ON_TRACK', 'COMPLETED');

-- CreateTable
CREATE TABLE "QuarterlyCheckIn" (
    "id" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "plannedTarget" DOUBLE PRECISION NOT NULL,
    "actualAchievement" DOUBLE PRECISION NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "employeeNote" TEXT,
    "managerComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterlyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuarterlyCheckIn_quarter_status_idx" ON "QuarterlyCheckIn"("quarter", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyCheckIn_goalId_quarter_key" ON "QuarterlyCheckIn"("goalId", "quarter");

-- AddForeignKey
ALTER TABLE "QuarterlyCheckIn" ADD CONSTRAINT "QuarterlyCheckIn_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
