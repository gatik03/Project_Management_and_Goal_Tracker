-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GoalStatus" ADD VALUE 'REWORK_REQUIRED';
ALTER TYPE "GoalStatus" ADD VALUE 'APPROVED';
ALTER TYPE "GoalStatus" ADD VALUE 'LOCKED';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "managerNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "managerId" TEXT;

-- CreateIndex
CREATE INDEX "Goal_reviewedById_idx" ON "Goal"("reviewedById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
