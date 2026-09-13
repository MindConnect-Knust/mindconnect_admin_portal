import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { notificationCentreApi } from "../../services/notificationCentreApi";
import { timeAgo } from "../../utils/formatters";

/**
 * The portal notification centre, in the existing topbar.
 *
 * Reads the signed-in user's own server-side notifications. Clicking one opens
 * the portal page it points at, which then fetches current state and applies
 * its own authorisation — the notification carries an id, never the record.
 *
 * For administrators the older provider review queue stays as a second section,
 * so this replaces nothing that already worked.
 *
 * Polls every minute while the tab is visible. Push is not how the portal
 * learns things; this is.
 */

const POLL_MS = 60 * 1000;

/** Portal destination for a notification route. Unknown routes stay put. */
const destinationFor = (item) => {
  const id = encodeURIComponent(item.entityId || "");
  switch (item.route) {
    case "case":
    case "case-outcomes":
      return id ? `/cases/${id}` : "/cases";
    case "staff-concern":
      return id ? `/concerns/${id}` : "/concerns";
    case "staff-referral":
      return "/staff/referrals";
    case "case-task":
      return "/cases";
    case "crisis-incident":
    case "crisis-followup":
    case "crisis-shifts":
      return "/crisis";
    case "care-referral":
    case "care-navigation-services":
      return "/crisis/care-navigation";
    case "analytics-health":
      return "/analytics";
    case "notification-health":
      return "/communications/push";
    case "appointments":
      return "/administration/appointments";
    default:
      return null;
  }
};

export default function NotificationMenu({ providerQueue = [], showProviderQueue = false }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await notificationCentreApi.unreadCount());
    } catch {
      // Keep the previous count; a failed poll should not blank the indicator.
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: rows } = await notificationCentreApi.list({ limit: 15 });
      setItems(rows);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = () => {
    setOpen((value) => {
      if (!value) loadList();
      return !value;
    });
  };

  const openItem = async (item) => {
    if (!item.read) {
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
      setUnread((count) => Math.max(0, count - 1));
      notificationCentreApi.markRead(item.id).catch(() => refreshCount());
    }
    const destination = !item.superseded && destinationFor(item);
    if (destination) {
      setOpen(false);
      navigate(destination);
    }
  };

  const markAll = async () => {
    setItems((current) => current.map((row) => ({ ...row, read: true })));
    setUnread(0);
    try {
      await notificationCentreApi.markAllRead();
    } catch {
      refreshCount();
    }
  };

  const providerUnread = showProviderQueue ? providerQueue.filter((row) => !row.read).length : 0;
  const hasIndicator = unread > 0 || providerUnread > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={19} aria-hidden="true" />
        {/* A quiet dot, not a red count: most of these are not emergencies. */}
        {hasIndicator && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" aria-hidden="true" />}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {items.some((row) => !row.read) && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                <CheckCheck size={13} aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4" aria-busy="true">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-10 animate-pulse rounded-lg bg-slate-50" />
                ))}
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Couldn't load notifications. {error}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">You're all caught up.</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full gap-2 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${item.superseded ? "opacity-60" : ""}`}
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.read ? "bg-slate-200" : "bg-emerald-600"}`} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className={`block text-sm leading-snug text-slate-800 ${item.read ? "" : "font-semibold"}`}>
                          {!item.read && <span className="sr-only">Unread. </span>}
                          {item.title}
                        </span>
                        <span className="block text-xs leading-snug text-slate-600">{item.body}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {timeAgo(item.createdAt)}
                          {item.superseded ? " · No longer current" : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showProviderQueue && (
              <div className="border-t border-slate-100">
                <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Provider review queue</p>
                {providerQueue.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-slate-400">No applications await review.</p>
                ) : (
                  providerQueue.map((row) => (
                    <div key={row.id} className="flex gap-2 px-4 py-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${row.read ? "bg-slate-200" : "bg-emerald-600"}`} aria-hidden="true" />
                      <div>
                        <p className="text-sm leading-snug text-slate-700">{row.message}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{timeAgo(row.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
