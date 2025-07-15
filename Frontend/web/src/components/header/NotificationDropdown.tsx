import { useState, useEffect } from 'react';
import { FaBell } from "react-icons/fa";
import { Notification } from '../types';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/notifications', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Set up polling
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/user/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      // Optimistically update the notification
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/user/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
            </div>
            {loading ? (
              <div className="px-4 py-3 text-center text-sm text-gray-500">
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-center text-sm text-red-500">
                {error}
              </div>
            ) : notifications?.length ? (
                  <div className="divide-y divide-gray-200">
                    {/* Header with "Mark all as read" */}
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                      >
                        Mark all as read
                      </button>
                    </div>
                      
                    {/* Notifications list */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`
                            px-4 py-3 cursor-pointer transition-colors
                            ${!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                              )}
                            </p>
                            <span className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You'll see alerts here when you have new notifications.
                    </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );  
}