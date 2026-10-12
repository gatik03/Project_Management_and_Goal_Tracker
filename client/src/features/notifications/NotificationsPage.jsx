import { useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { notificationsKey, useNotifications } from "../../lib/notifications";
import { Button, EmptyState, Skeleton, useToast } from "../../ui";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
});

export default function NotificationsPage() {
  const query = useNotifications();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const notifications = query.data?.pages.flatMap((page) => page.notifications) ?? [];
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;

  async function openNotification(event, notification) {
    if (busyId) {
      event.preventDefault();
      return;
    }
    if (notification.readAt) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      void api.markNotificationRead(notification.id)
        .then(() => cache.invalidateQueries({ queryKey: notificationsKey }))
        .catch((failure) => setError(failure.message));
      return;
    }
    event.preventDefault();
    setError("");
    setBusyId(notification.id);
    try {
      await api.markNotificationRead(notification.id);
      await cache.invalidateQueries({ queryKey: notificationsKey });
    } catch (failure) {
      setError(failure.message);
      setBusyId(null);
      return;
    }
    setBusyId(null);
    navigate(notification.href);
  }

  async function markAllRead() {
    setBusyId("all");
    setError("");
    try {
      await api.markAllNotificationsRead();
      await cache.invalidateQueries({ queryKey: notificationsKey });
      toast("All notifications marked as read");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="page-intro">
            Decisions and quarterly updates that need your attention.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button disabled={Boolean(busyId)} onClick={markAllRead}>
            <Check size={16} aria-hidden="true" />
            {busyId === "all" ? "Marking…" : "Mark all as read"}
          </Button>
        )}
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      {query.isPending ? (
        <Skeleton lines={5} />
      ) : query.error ? (
        <div className="panel panel-pad">
          <h2>Could not load notifications</h2>
          <p className="error-text">{query.error.message}</p>
          <Button onClick={() => query.refetch()}>Retry</Button>
        </div>
      ) : notifications.length ? (
        <div className="panel notification-list" aria-label="Recent notifications">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              to={notification.href}
              className="notification-row"
              data-unread={!notification.readAt}
              aria-busy={busyId === notification.id}
              onClick={(event) => openNotification(event, notification)}
            >
              <span className="notification-symbol" aria-hidden="true">
                <Bell size={18} />
              </span>
              <span className="notification-content">
                <strong>{notification.title}</strong>
                <span>{notification.detail}</span>
                <span className="small muted">
                  {dateTime.format(new Date(notification.createdAt))}
                </span>
              </span>
              <span className="notification-state">
                {busyId === notification.id ? "Opening…" : notification.readAt ? "Read" : "Unread"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title="Nothing needs your attention"
            description="Plan decisions and quarterly updates will appear here as they happen."
          />
        </div>
      )}
      {query.hasNextPage && (
        <div className="space-before-sm">
          <Button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
            {query.isFetchingNextPage ? "Loading more" : "Show older notifications"}
          </Button>
        </div>
      )}
    </>
  );
}
