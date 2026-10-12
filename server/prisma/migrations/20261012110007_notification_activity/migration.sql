-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PLAN_SUBMITTED', 'GOAL_WEIGHTS_CHANGED', 'GOAL_TARGET_CHANGED', 'GOAL_APPROVED', 'GOAL_REWORK_REQUESTED', 'CHECKIN_SAVED', 'CHECKIN_COMMENTED', 'GOAL_UNLOCKED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'NOTIFICATIONS_READ';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "actorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_id_idx" ON "Notification"("recipientId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
