"use server";

import { createClient } from "@/lib/supabase/server";
import {
  updateUserSettingsSchema,
  markNotificationSchema,
  createNotificationSchema,
  type UpdateUserSettingsInput,
  type CreateNotificationInput,
} from "@/lib/validations/companion-notifications";
import type { Notification, UserSettings } from "@/types/database";

export interface NotificationsResult {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  error?: string;
}

export async function getUserNotifications(): Promise<NotificationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, notifications: [], unreadCount: 0, error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return { success: false, notifications: [], unreadCount: 0, error: error.message };
  }

  const notifications = (data || []) as Notification[];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    success: true,
    notifications,
    unreadCount,
  };
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const parsed = markNotificationSchema.safeParse({ notification_id: notificationId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data.notification_id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getUserSettings(): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required" };

  let { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings) {
    const { data: created, error } = await supabase
      .from("user_settings")
      .insert({
        user_id: user.id,
        sound_effects: true,
        activity_visibility: "friends",
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00:00",
        quiet_hours_end: "07:00:00",
        reduced_motion: false,
      })
      .select()
      .single();

    if (error || !created) {
      return { success: false, error: "Failed to initialize settings" };
    }
    settings = created;
  }

  return { success: true, settings: settings as UserSettings };
}

export async function updateUserSettings(input: UpdateUserSettingsInput): Promise<{
  success: boolean;
  settings?: UserSettings;
  error?: string;
}> {
  const parsed = updateUserSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required" };

  // Ensure settings row exists
  await getUserSettings();

  const { data: updated, error } = await supabase
    .from("user_settings")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !updated) {
    return { success: false, error: error?.message || "Failed to update settings" };
  }

  return { success: true, settings: updated as UserSettings };
}

export async function dispatchNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const parsed = createNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: parsed.data.user_id,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      data: parsed.data.data || {},
      is_read: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to create notification" };
  }

  return { success: true, notificationId: data.id };
}

