"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    // Set up polling every 60 seconds to keep unread count fresh
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      const res = await fetch("/api/notifications", {
        method: "PUT",
      });

      if (!res.ok) {
        // Rollback on failure
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setIsOpen(false);

    // If it's unread, we mark it as read in the background (or relying on PUT mark all read)
    // To be clean, if they clicked a specific unread notification, they can see its target.
    // Since we don't have a single-mark-as-read API endpoint requested, we'll navigate immediately.
    // If they go to the link, that's fine.
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) {
      return "Vừa xong";
    }
    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    }
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Hôm qua";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute right-0 mt-3 bg-white/95 backdrop-blur-md border border-slate-100/80 shadow-2xl p-4 w-80 max-h-[400px] rounded-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100/60 mb-2">
            <h3 className="font-semibold text-slate-800 text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="overflow-y-auto flex-1 pr-0.5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                <Inbox className="h-8 w-8 text-slate-300" />
                <span className="text-xs font-medium">Không có thông báo mới</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl cursor-pointer transition-all border-l-2 hover:bg-slate-50/80 active:bg-slate-50 ${
                    notification.isRead
                      ? "border-transparent bg-transparent"
                      : "border-blue-500 bg-blue-50/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800 text-xs leading-tight">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
