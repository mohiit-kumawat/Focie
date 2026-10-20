"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Moon,
  Clock,
  Sparkles,
  Shield,
  Check,
  AlertCircle,
} from "lucide-react";
import { updateUserSettings } from "@/app/actions/notifications";
import type { UserSettings } from "@/types/database";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: UserSettings | null;
  onSettingsUpdated?: (newSettings: UserSettings) => void;
  previewMode?: boolean;
  inline?: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  initialSettings = null,
  onSettingsUpdated,
  previewMode = false,
  inline = false,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(
    initialSettings || {
      id: "s-1",
      user_id: "u-1",
      sound_effects: true,
      activity_visibility: "friends",
      quiet_hours_enabled: true,
      quiet_hours_start: "22:00:00",
      quiet_hours_end: "07:00:00",
      reduced_motion: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!previewMode) {
        const res = await updateUserSettings({
          sound_effects: settings.sound_effects,
          activity_visibility: settings.activity_visibility,
          quiet_hours_enabled: settings.quiet_hours_enabled,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
          reduced_motion: settings.reduced_motion,
        });
        if (res.success && res.settings) {
          setSettings(res.settings);
          onSettingsUpdated?.(res.settings);
          setFeedback("✓ Settings saved successfully!");
          setTimeout(() => setFeedback(null), 2500);
        }
      } else {
        setFeedback("✓ Settings saved successfully!");
        setTimeout(() => setFeedback(null), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <motion.div
      initial={inline || previewMode ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-2xl p-6 sm:p-8 space-y-6 text-[#4A3E4D] dark:text-[#F8F1FF]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0E4DE] dark:border-[#352B46]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FFEBF0] dark:bg-[#302641] text-[#FF729F]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold">Preferences & Privacy</h3>
            <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
              FR-10 Notification limits & activity controls
            </p>
          </div>
        </div>

        {!inline && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F0E4DE] dark:hover:bg-[#302641] text-[#A49AAB] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-[#EAF5EE] dark:bg-[#182B24] border border-[#A5D6A7] dark:border-[#234A38] text-xs font-bold text-[#2E7D4E] dark:text-[#91E6C1] flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-[#91E6C1]" />
              <span>{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Activity Visibility (Privacy) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#786C7B] dark:text-[#B9AEC9] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#C5A7FF]" />
              <span>Study Activity Visibility</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "public", label: "Public 🌐", desc: "Visible to all" },
                { id: "friends", label: "Friends 🌸", desc: "Only study buddies" },
                { id: "private", label: "Incognito 🤫", desc: "Appear offline" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      activity_visibility: opt.id as UserSettings["activity_visibility"],
                    })
                  }
                  className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    settings.activity_visibility === opt.id
                      ? "bg-[#FF729F]/15 border-[#FF729F] ring-2 ring-[#FF729F]/30"
                      : "bg-[#FAF7FC] dark:bg-[#1D1729] border-[#F0E4DE] dark:border-[#352B46]"
                  }`}
                >
                  <p className="text-xs font-black">{opt.label}</p>
                  <p className="text-[10px] text-[#A49AAB]">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Quiet Hours / Do Not Disturb (FR-10) */}
          <div className="p-4 rounded-2xl bg-[#FAF7FC] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#F6D28B]" />
                <div>
                  <h4 className="text-xs font-black">Quiet Hours (Do-Not-Disturb)</h4>
                  <p className="text-[10px] text-[#786C7B] dark:text-[#B9AEC9]">
                    Mute study invites and notifications during sleep
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.quiet_hours_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, quiet_hours_enabled: e.target.checked })
                }
                className="w-4 h-4 accent-[#FF729F] cursor-pointer"
              />
            </div>

            {settings.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F0E4DE]/60 dark:border-[#352B46]/60">
                <div>
                  <label className="block text-[10px] font-bold text-[#786C7B] dark:text-[#B9AEC9] mb-1">
                    Start (Sleep Time):
                  </label>
                  <input
                    type="time"
                    value={settings.quiet_hours_start.slice(0, 5)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quiet_hours_start: `${e.target.value}:00`,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#786C7B] dark:text-[#B9AEC9] mb-1">
                    End (Wake Time):
                  </label>
                  <input
                    type="time"
                    value={settings.quiet_hours_end.slice(0, 5)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quiet_hours_end: `${e.target.value}:00`,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Audio & Accessibility */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, sound_effects: !settings.sound_effects })
              }
              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                settings.sound_effects
                  ? "bg-[#91E6C1]/15 border-[#91E6C1]"
                  : "bg-[#FAF7FC] dark:bg-[#1D1729] border-[#F0E4DE] dark:border-[#352B46]"
              }`}
            >
              {settings.sound_effects ? (
                <Volume2 className="w-4 h-4 text-[#91E6C1]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#A49AAB]" />
              )}
              <div>
                <p className="text-xs font-black">Sound Effects</p>
                <p className="text-[10px] text-[#A49AAB]">
                  {settings.sound_effects ? "Enabled" : "Muted"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, reduced_motion: !settings.reduced_motion })
              }
              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                settings.reduced_motion
                  ? "bg-[#C5A7FF]/15 border-[#C5A7FF]"
                  : "bg-[#FAF7FC] dark:bg-[#1D1729] border-[#F0E4DE] dark:border-[#352B46]"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C5A7FF]" />
              <div>
                <p className="text-xs font-black">Reduced Motion</p>
                <p className="text-[10px] text-[#A49AAB]">
                  {settings.reduced_motion ? "Active" : "Normal"}
                </p>
              </div>
            </button>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#A49AAB] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </motion.div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {content}
    </div>
  );
}
