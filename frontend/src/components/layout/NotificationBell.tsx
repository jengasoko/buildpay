import { useEffect, useRef, useState } from 'react';
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/hooks/useNotifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadCount();
  const notifications = useNotifications(10);
  const markAllRead = useMarkAllNotificationsRead();
  const refetchUnread = unread.refetch;

  const items = notifications.data?.items ?? [];

  useEffect(() => {
    if (open && refetchUnread) {
      refetchUnread();
    }
  }, [open, refetchUnread]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    refetchUnread();
  };

  const count = unread.data ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 min-w-[18px] h-[18px] text-xs font-semibold text-white bg-red-500 rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">You're all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((notification) => (
                  <li
                    key={notification.id}
                    className={`px-4 py-3 ${notification.is_read ? 'bg-white' : 'bg-indigo-50'}`}
                  >
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}