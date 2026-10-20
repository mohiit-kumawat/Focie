"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Gift,
  Coins,
  Send,
  Sparkles,
  Heart,
  MessageSquare,
  RotateCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserWallet,
  getGiftCatalog,
  getReceivedGifts,
  sendGiftToFriend,
  type ReceivedGiftWithSender,
} from "@/app/actions/wallet-gifts";
import type { GiftItem, UserWallet } from "@/types/database";

interface FriendOption {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

interface GiftingShopWidgetProps {
  friends?: FriendOption[];
  initialWallet?: UserWallet | null;
  initialCatalog?: GiftItem[];
  initialSelectedGift?: GiftItem | null;
  initialSelectedFriendId?: string;
  initialNote?: string;
  previewMode?: boolean;
}

export function GiftingShopWidget({
  friends = [],
  initialWallet = null,
  initialCatalog = [],
  initialSelectedGift = null,
  initialSelectedFriendId = "",
  initialNote = "",
  previewMode = false,
}: GiftingShopWidgetProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "received">("catalog");
  const [wallet, setWallet] = useState<UserWallet | null>(initialWallet);
  const [catalog, setCatalog] = useState<GiftItem[]>(initialCatalog);
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGiftWithSender[]>([]);
  const [loading, setLoading] = useState<boolean>(
    previewMode ? false : (!initialWallet && !initialCatalog.length)
  );

  // Sending state
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(initialSelectedGift);
  const [selectedFriendId, setSelectedFriendId] = useState<string>(initialSelectedFriendId);
  const [note, setNote] = useState<string>(initialNote);
  const [sending, setSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sentHearts, setSentHearts] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, c, r] = await Promise.all([
        getUserWallet(),
        getGiftCatalog(),
        getReceivedGifts(),
      ]);
      setWallet(w);
      setCatalog(c);
      setReceivedGifts(r);
    } catch {
      // Ignore network errors on background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewMode) return;
    loadData();
  }, [loadData, previewMode]);

  // Subscribe to real-time gifts and wallet balance
  useEffect(() => {
    if (previewMode) return;
    const supabase = createClient();
    const channel = supabase
      .channel("gifting-realtime-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gift_transfers" },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_wallets" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGift || !selectedFriendId) return;

    setSending(true);
    setFeedback(null);

    const idempotencyKey = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await sendGiftToFriend({
        recipient_id: selectedFriendId,
        gift_id: selectedGift.id,
        note: note.trim() || undefined,
        idempotency_key: idempotencyKey,
      });

      if (res.success) {
        setSentHearts(true);
        setTimeout(() => setSentHearts(false), 2500);

        setFeedback({
          type: "success",
          text: `🎉 Sent ${selectedGift.name} ${selectedGift.emoji} to your study buddy!`,
        });

        if (res.remainingBalance !== undefined && wallet) {
          setWallet({ ...wallet, balance: res.remainingBalance });
        }

        setSelectedGift(null);
        setSelectedFriendId("");
        setNote("");
        loadData();
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to send gift" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error sending gift" });
    } finally {
      setSending(false);
    }
  };

  const balance = wallet?.balance ?? 50;

  return (
    <div className="rounded-3xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-6 sm:p-7 lg:p-8 transition-colors relative overflow-hidden">
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#FF729F]/60 to-transparent pointer-events-none" />

      {/* Floating Sparkle/Heart Animation on Send */}
      <AnimatePresence>
        {sentHearts && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1.2, y: -40 }}
            exit={{ opacity: 0, scale: 1.5, y: -80 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-2 text-3xl"
          >
            <span>💖</span>
            <span>✨</span>
            <span>🌸</span>
            <span>🎁</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: Title, Balance Badge & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0E4DE] dark:border-[#352B46]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FFEBF0] dark:bg-[#302641] text-[#FF729F] border border-transparent dark:border-[#40354F]/50">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#4A3E4D] dark:text-[#F8F1FF] flex items-center gap-2">
              <span>Cozy Gift Shop</span>
              <span className="text-xs font-black text-[#F6D28B] flex items-center gap-1 bg-[#3D2C1B] px-2.5 py-0.5 rounded-full border border-[#5E4426] shadow-xs">
                <Coins className="w-3.5 h-3.5 text-[#F6D28B]" />
                <span>{balance} Coins</span>
              </span>
            </h3>
            <p className="text-[11px] text-[#786C7B] dark:text-[#B9AEC9]">
              Earn coins by studying & encourage study buddies with gifts
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-[#FFF5F8] dark:bg-[#302641] border border-[#F0E4DE] dark:border-[#40354F]">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "catalog"
                  ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                  : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "received"
                  ? "bg-white dark:bg-[#241D33] text-[#FF729F] shadow-xs"
                  : "text-[#7D6E7E] dark:text-[#B9AEC9] hover:text-[#4A3E4D] dark:hover:text-[#F8F1FF]"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Received</span>
              {receivedGifts.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FF729F] text-white text-[9px] font-black flex items-center justify-center">
                  {receivedGifts.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl text-[#A49AAB] hover:text-[#FF729F] transition-all cursor-pointer"
            title="Refresh balance and gifts"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-[#EAF5EE] dark:bg-[#182B24] text-[#2E7D4E] dark:text-[#91E6C1] border-[#A5D6A7] dark:border-[#234A38]"
                : "bg-[#FFF0F0] dark:bg-[#3D1E22] text-[#D32F2F] dark:text-[#FF8A80] border-[#FFCDD2] dark:border-[#5C2329]"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#91E6C1]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#FF8A80]" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: GIFT CATALOG & SENDING FORM */}
      {activeTab === "catalog" && (
        <div className="mt-5 space-y-6">
          {/* Gift Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {catalog.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              const canAfford = balance >= gift.coin_price;

              return (
                <div
                  key={gift.id}
                  onClick={() => setSelectedGift(isSelected ? null : gift)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center space-y-1.5 ${
                    isSelected
                      ? "bg-[#FFEBF0]/70 dark:bg-[#3D263B] border-[#FF729F] ring-2 ring-[#FF729F]/40 shadow-md scale-102"
                      : "bg-[#FFFDF9] dark:bg-[#1D1729] border-[#F0E4DE] dark:border-[#352B46] hover:border-[#FF729F]/50 hover:scale-102"
                  }`}
                >
                  <span className="text-3xl sm:text-4xl select-none filter drop-shadow-sm">
                    {gift.emoji}
                  </span>
                  <p className="text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF] line-clamp-1">
                    {gift.name}
                  </p>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      canAfford
                        ? "bg-[#FFF8E5] dark:bg-[#3D2C1B] text-[#D99B16] dark:text-[#F6D28B] border border-[#D99B16]/30"
                        : "bg-gray-100 dark:bg-[#302641] text-gray-400 border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <Coins className="w-3 h-3" />
                    <span>{gift.coin_price}</span>
                  </div>
                  <p className="text-[9px] text-[#786C7B] dark:text-[#B9AEC9] line-clamp-2">
                    {gift.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Transfer Form (Active when a gift is selected) */}
          <AnimatePresence>
            {selectedGift && (
              <motion.form
                initial={previewMode ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onSubmit={handleSendGift}
                className="p-5 rounded-2xl bg-gradient-to-r from-[#FFF5F8] to-[#FAF4FF] dark:from-[#302641] dark:to-[#281F38] border border-[#FF729F]/40 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedGift.emoji}</span>
                    <div>
                      <h4 className="text-sm font-black text-[#4A3E4D] dark:text-[#F8F1FF]">
                        Send {selectedGift.name}
                      </h4>
                      <p className="text-[11px] text-[#FF729F] font-bold">
                        Cost: {selectedGift.coin_price} coins &bull; Your balance: {balance} coins
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGift(null)}
                    className="text-xs text-[#A49AAB] hover:text-[#FF729F] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Friend */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E4D] dark:text-[#B9AEC9] mb-1">
                      Choose Study Buddy:
                    </label>
                    {friends.length === 0 ? (
                      <p className="text-xs text-[#A49AAB] p-2 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F]">
                        No accepted study buddies yet. Add friends first! 🌸
                      </p>
                    ) : (
                      <select
                        value={selectedFriendId}
                        onChange={(e) => setSelectedFriendId(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-xs font-bold text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
                      >
                        <option value="">Select a buddy...</option>
                        {friends.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} (@{f.username})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Encouragement Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3E4D] dark:text-[#B9AEC9] mb-1">
                      Encouragement Note (Optional):
                    </label>
                    <input
                      type="text"
                      maxLength={140}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Keep up the great study streak! 💖"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#241D33] border border-[#F0E4DE] dark:border-[#40354F] text-xs text-[#4A3E4D] dark:text-[#F8F1FF] focus:outline-hidden focus:ring-2 focus:ring-[#FF729F]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={sending || !selectedFriendId || balance < selectedGift.coin_price}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF729F] to-[#F25577] text-white text-xs font-black shadow-md shadow-[#FF729F]/30 hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Gift ({selectedGift.coin_price} Coins)</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB 2: RECEIVED GIFTS SHOWCASE */}
      {activeTab === "received" && (
        <div className="mt-5">
          {receivedGifts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-4xl">🎁</div>
              <p className="text-sm font-bold text-[#4A3E4D] dark:text-[#F8F1FF]">
                No gifts received yet!
              </p>
              <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9] max-w-sm">
                Study with friends, encourage each other, and exchange cozy matcha lattes and star rewards!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {receivedGifts.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1D1729] border border-[#F0E4DE] dark:border-[#352B46] flex items-start gap-3 shadow-xs"
                >
                  <span className="text-3xl shrink-0">{transfer.gift?.emoji || "🎁"}</span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#4A3E4D] dark:text-[#F8F1FF] truncate">
                        {transfer.gift?.name || "Cozy Gift"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#FF729F] font-bold">
                      From {transfer.senderName}
                    </p>
                    {transfer.note && (
                      <p className="text-xs text-[#786C7B] dark:text-[#B9AEC9] italic bg-[#FFF5F8] dark:bg-[#302641] p-2 rounded-xl border border-[#F0E4DE] dark:border-[#40354F]">
                        &ldquo;{transfer.note}&rdquo;
                      </p>
                    )}
                    <p className="text-[9px] text-[#A49AAB]">
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

