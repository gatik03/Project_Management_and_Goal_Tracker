import { prisma } from "../../config/prisma.js";
import { withSerializableTransaction } from "../../config/transaction.js";

export async function notify(db, data) {
  if (!data.recipientId) return null;
  return db.notification.create({ data });
}

export async function listNotifications(recipientId, { limit = 20, cursor } = {}) {
  if (cursor) {
    const owned = await prisma.notification.findFirst({
      where: { id: cursor, recipientId }, select: { id: true }
    });
    if (!owned) {
      const error = new Error("Notification cursor not found");
      error.statusCode = 404;
      throw error;
    }
  }
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    }),
    prisma.notification.count({ where: { recipientId, readAt: null } })
  ]);
  const notifications = rows.slice(0, limit);
  return {
    notifications,
    nextCursor: rows.length > limit ? notifications.at(-1).id : null,
    unreadCount
  };
}

export async function markNotificationRead(recipientId, id, audit) {
  return withSerializableTransaction(async (db) => {
    const existing = await db.notification.findFirst({ where: { id, recipientId } });
    if (!existing) {
      const error = new Error("Notification not found");
      error.statusCode = 404;
      throw error;
    }
    if (existing.readAt) return existing;
    const notification = await db.notification.update({
      where: { id }, data: { readAt: new Date() }
    });
    await audit({
      action: "NOTIFICATIONS_READ", entityType: "Notification", entityId: id,
      oldValue: { readAt: null }, newValue: { readAt: notification.readAt }
    }, db);
    return notification;
  });
}

export async function markAllNotificationsRead(recipientId, audit) {
  return withSerializableTransaction(async (db) => {
    const updated = await db.notification.updateMany({
      where: { recipientId, readAt: null }, data: { readAt: new Date() }
    });
    if (updated.count) {
      await audit({
        action: "NOTIFICATIONS_READ", entityType: "User", entityId: recipientId,
        oldValue: { unreadCount: updated.count }, newValue: { unreadCount: 0 }
      }, db);
    }
    return updated.count;
  });
}
