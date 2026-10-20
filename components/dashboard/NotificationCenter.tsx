"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Check,
  CheckCheck,
  Gift,
  UserPlus,
  Sparkles,
  Users,
  Flame,
  X,
} from "lucide-react";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/app/actions/notifications";
import type { Notification, NotificationType } from "@/types/database";

interface NotificationCenterProps {
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
  previewMode?: boolean;
  forceOpen?: boolean;
}

export function NotificationCenter({
  initialNotifications = [],
  initialUnreadCount = 0,
  previewMode = false,
  forceOpen = false,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (previewMode) return;
    setLoading(true);
    try {
      const res = await getUserNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (previewMode) return;
    loadNotifications();
  }, [previewMode]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkOne = async (id: string) => {
    if (previewMode) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      return;
    }
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAll = async () => {
    if (previewMode) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return;
    }
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "gift_received":
        return <Gift className="w-4 h-4 text-[#FF729F]" />;
      case "friend_request":
      case "friend_accepted":
        return <UserPlus className="w-4 h-4 text-[#91E6C1]" />;
      case "level_up":
      case "milestone_unlocked":
        return <Sparkles className="w-4 h-4 text-[#F6D28B]" />;
      case "room_invite":
        return <Users className="w-4 h-4 text-[#C5A7FF]" />;
      default:
        return <Bell className="w-4 h-4 text-[#FF729F]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-[#786C7B] dark:text-[#F8F1FF] hover:border-[#FF729F] hover:text-[#FF729F] transition-all cursor-pointer shadow-xs"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-[#FF729F] text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#171321] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#F0E4DE] dark:border-[#352B46] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#FF729F]" />
                <h4 className="font-black text-sm text-[#4A3E4D] dark:text-[#F8F1FF]">
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFEBF0] dark:bg-[#302641] text-[10px] font-bold text-[#FF729F]">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs font-bold text-[#A49AAB] hover:text-[#FF729F] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#F0E4DE]/60 dark:divide-[#352B46]/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <span className="text-3xl select-none">🌸</span>
                  <p className="text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                    All caught up!
                  </p>
                  <p className="text-[11px] text-[#A49AAB]">
                    Time for peaceful focus and gentle study rest.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      !n.is_read
                        ? "bg-[#FFF5F8]/70 dark:bg-[#2F243E]"
                        : "hover:bg-[#FAF7FC] dark:hover:bg-[#1D1729]"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] shrink-0 mt-0.5">
                      {getTypeIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF] truncate">
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkOne(n.id)}
                            className="text-[#A49AAB] hover:text-[#FF729F] cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9] leading-relaxed mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-[#A49AAB] mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
