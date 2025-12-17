'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { 
  getStudentNotifications, 
  markStudentNotificationRead,
  markAllStudentNotificationsRead 
} from '@/server/actions/student-notifications';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  icon: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface StudentNotificationCenterProps {
  studentId: string;
}

export default function StudentNotificationCenter({ studentId }: StudentNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [studentId]);

  const loadNotifications = async () => {
    const data = await getStudentNotifications(studentId);
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkRead = async (id: string) => {
    await markStudentNotificationRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const handleMarkAllRead = async () => {
    await markAllStudentNotificationsRead(studentId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border z-50 overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Pas de notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={() => handleMarkRead(notification.id)}
                        getTimeAgo={getTimeAgo}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ 
  notification, 
  onMarkRead,
  getTimeAgo 
}: { 
  notification: Notification;
  onMarkRead: () => void;
  getTimeAgo: (date: string) => string;
}) {
  const content = (
    <div 
      className={`p-4 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-indigo-50/50' : ''
      }`}
      onClick={onMarkRead}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{notification.icon || '🔔'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 text-sm truncate">
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="h-2 w-2 bg-indigo-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {getTimeAgo(notification.created_at)}
          </p>
        </div>
        {notification.action_url && (
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url}>
        {content}
      </Link>
    );
  }

  return content;
}
