-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'GOAL_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'GOAL_EDITED_BY_MANAGER';
ALTER TYPE "AuditAction" ADD VALUE 'GOAL_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'GOAL_REWORK_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECKIN_SAVED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECKIN_COMMENTED';
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'GOAL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'GOAL_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'GOAL_DELETED';

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- Keep impossible weights out of the database, even when writes bypass the API.
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_weightage_range_check"
  CHECK ("weightage" BETWEEN 10 AND 100);

-- Audit rows are append-only for ordinary application writes. Privileged
-- database operators retain TRUNCATE for disaster recovery and test resets.
CREATE FUNCTION reject_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog rows are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
