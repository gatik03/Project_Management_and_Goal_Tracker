import { prisma } from "../config/prisma.js";

function toAuditJson(value) {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
}

export function attachAuditLogger(request, _response, next) {
  request.audit = async ({ action, entityType, entityId, oldValue, newValue, actorEmail }, db = prisma) => {
    const actor = request.user;

    await db.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actorEmail ?? actor?.email ?? "system",
        action,
        entityType,
        entityId,
        oldValue: toAuditJson(oldValue),
        newValue: toAuditJson(newValue)
      }
    });
  };

  next();
}
