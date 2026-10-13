import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bell, CheckCheck, X } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notification';
import { supabase } from '../../services/supabase';
import type { Notification } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const NOTIFICATIONS_PER_PAGE = 20;

export default function NotificationCenter({ isOpen, onClose, onNavigate, onUnreadCountChange }: NotificationCenterProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async (showLoading = true, reset = false) => {
    if (!user) return;

    const currentOffset = reset ? 0 : offset;

    if (showLoading) {
      setIsLoading(true);
    }
    if (reset) {
      setOffset(0);
      setHasMore(true);
    }
    setError(null);

    try {
      const data = await getNotifications(user.id, NOTIFICATIONS_PER_PAGE, currentOffset);

      if (reset) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      setHasMore(data.length >= NOTIFICATIONS_PER_PAGE);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Det gick inte att ladda notiser');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
      setLoadingMore(false);
    }
  }, [user, offset]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !user) return;

    setLoadingMore(true);
    const newOffset = offset + NOTIFICATIONS_PER_PAGE;
    setOffset(newOffset);

    try {
      const data = await getNotifications(user.id, NOTIFICATIONS_PER_PAGE, newOffset);
      setNotifications(prev => [...prev, ...data]);
      setHasMore(data.length >= NOTIFICATIONS_PER_PAGE);
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, offset, hasMore, loadingMore]);

  // Load notifications when opened
  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setNotifications([]);
      setOffset(0);
      setHasMore(true);
      loadNotifications(true, true);
    }
  }, [isOpen]);

  // Infinite scroll observer
  useEffect(() => {
    if (!isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, root: scrollContainerRef.current }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isOpen, hasMore, loadingMore, isLoading, loadMore]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user || !isOpen) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Reload from beginning on real-time update
        setNotifications([]);
        setOffset(0);
        setHasMore(true);
        loadNotifications(false, true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
      // Update the unread badge count in parent
      const newUnread = notifications.filter(n => !n.is_read && n.id !== notification.id).length;
      onUnreadCountChange?.(newUnread);
    }

    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
    }

    // Close dropdown and notify parent
    onClose();
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;

    try {
      await markAllAsRead(user.id);
      await loadNotifications(false);
      onUnreadCountChange?.(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Backdrop - transparent on desktop, dark overlay on mobile */}
      <div
        className="fixed inset-0 z-40 md:bg-transparent bg-surface-950/60 transition-opacity"
        onClick={onClose}
      />

      {/* Desktop: Dropdown | Mobile: Slide-in panel from right */}
      <div className="
        fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-surface-800 shadow-elevated dark:shadow-elevated-dark border-l border-surface-200 dark:border-surface-700 z-50 flex flex-col animate-slide-in-right
        md:absolute md:inset-y-auto md:right-0 md:top-full md:mt-2 md:w-96 md:max-h-[600px] md:rounded-lg md:border md:animate-none
      ">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">Notiser</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="min-h-11 px-2 rounded-lg text-xs text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-50 dark:hover:bg-surface-700 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Markera alla som lästa
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center min-w-11 min-h-11 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-error-strong dark:text-error-soft mb-2">{error}</p>
              <button onClick={() => loadNotifications(true, true)} className="btn-secondary">
                Försök igen
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-surface-400 dark:text-surface-400" />
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-300">Inga notiser än</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Du får notiser om kommentarer, reaktioner och meddelanden
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={observerTarget} className="py-4 text-center">
                  {loadingMore ? (
                    <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Laddar fler...</span>
                    </div>
                  ) : (
                    <span className="text-xs text-surface-500 dark:text-surface-400">Skrolla för fler</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
