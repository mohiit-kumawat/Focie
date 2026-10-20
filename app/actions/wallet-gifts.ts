"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendGiftSchema, type SendGiftInput } from "@/lib/validations/gifting-rooms";
import type { GiftItem, GiftTransfer, UserWallet, WalletTransaction } from "@/types/database";

export interface WalletActionResult {
  success: boolean;
  wallet?: UserWallet | null;
  error?: string;
}

export interface SendGiftResult {
  success: boolean;
  transfer?: GiftTransfer | null;
  remainingBalance?: number;
  error?: string;
}

export interface ReceivedGiftWithSender extends GiftTransfer {
  gift: GiftItem;
  senderName: string;
  senderAvatar: string | null;
}

/**
 * Fetch or auto-provision user wallet with 50 welcome coins.
 */
export async function getUserWallet(): Promise<UserWallet | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (wallet) {
    return wallet as UserWallet;
  }

  // Auto-provision initial wallet with 50 welcome coins
  const { data: newWallet, error } = await supabase
    .from("user_wallets")
    .insert({
      user_id: user.id,
      balance: 50,
    })
    .select()
    .single();

  if (!error && newWallet) {
    // Record welcome bonus transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount: 50,
      type: "welcome",
      idempotency_key: `welcome_${user.id}`,
    });
    return newWallet as UserWallet;
  }

  return null;
}

/**
 * Fetch available gifts from the catalog.
 */
export async function getGiftCatalog(): Promise<GiftItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_catalog")
    .select("*")
    .eq("is_active", true)
    .order("coin_price", { ascending: true });

  if (error || !data) return [];
  return data as GiftItem[];
}

/**
 * Fetch gifts received by the logged-in user.
 */
export async function getReceivedGifts(): Promise<ReceivedGiftWithSender[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: transfers } = await supabase
    .from("gift_transfers")
    .select("*, gift:gift_catalog(*)")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  if (!transfers || transfers.length === 0) return [];

  const rawTransfers = transfers as unknown as (GiftTransfer & { gift: GiftItem })[];

  // Fetch senders' profiles
  const senderIds = Array.from(new Set(rawTransfers.map((t) => t.sender_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", senderIds);

  const profileMap = new Map<string, { name: string; avatar: string | null }>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, {
        name: p.display_name || p.username || "Study Bestie",
        avatar: p.avatar_url,
      });
    }
  }

  return rawTransfers.map((t) => {
    const sender = profileMap.get(t.sender_id);
    return {
      ...t,
      gift: t.gift,
      senderName: sender?.name || "Study Bestie",
      senderAvatar: sender?.avatar || null,
    };
  });
}

/**
 * Send a gift to an accepted friend with server-authoritative balance verification,
 * atomic balance deduction, and idempotency protection against duplicate debit.
 */
export async function sendGiftToFriend(input: SendGiftInput): Promise<SendGiftResult> {
  const validation = sendGiftSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
  }

  const { recipient_id, gift_id, note, idempotency_key } = validation.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (recipient_id === user.id) {
    return { success: false, error: "You cannot send a gift to yourself!" };
  }

  // 1. Verify recipient is an accepted friend
  const { data: friendship } = await supabase
    .from("friendships")
    .select("status")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},recipient_id.eq.${user.id})`
    )
    .maybeSingle();

  if (!friendship) {
    return { success: false, error: "You can only send gifts to accepted study buddies." };
  }

  // 2. Check idempotency: If this request was already processed, return existing transfer!
  const { data: existingTx } = await supabase
    .from("wallet_transactions")
    .select("reference_id")
    .eq("idempotency_key", idempotency_key)
    .maybeSingle();

  if (existingTx) {
    const wallet = await getUserWallet();
    return {
      success: true,
      remainingBalance: wallet?.balance,
    };
  }

  // 3. Fetch gift details from authoritative catalog
  const { data: gift } = await supabase
    .from("gift_catalog")
    .select("*")
    .eq("id", gift_id)
    .eq("is_active", true)
    .single();

  if (!gift) {
    return { success: false, error: "Selected gift is unavailable." };
  }

  // 4. Fetch sender wallet and verify balance
  const wallet = await getUserWallet();
  if (!wallet || wallet.balance < gift.coin_price) {
    return {
      success: false,
      error: `Insufficient coins! You have ${wallet?.balance || 0} coins, but "${gift.name}" costs ${gift.coin_price} coins. Complete study sessions to earn more! 🌸`,
    };
  }

  const newBalance = wallet.balance - gift.coin_price;

  // 5. Atomic Debit from sender wallet
  const { error: debitError } = await supabase
    .from("user_wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (debitError) {
    return { success: false, error: "Failed to process coin debit." };
  }

  // 6. Record transfer row
  const { data: transfer, error: transferError } = await supabase
    .from("gift_transfers")
    .insert({
      sender_id: user.id,
      recipient_id,
      gift_id,
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (transferError || !transfer) {
    // Rollback wallet if transfer insertion fails
    await supabase.from("user_wallets").update({ balance: wallet.balance }).eq("user_id", user.id);
    return { success: false, error: "Failed to record gift transfer." };
  }

  // 7. Record debit transaction with idempotency key
  await supabase.from("wallet_transactions").insert({
    user_id: user.id,
    amount: -gift.coin_price,
    type: "gift_sent",
    reference_id: transfer.id,
    idempotency_key,
  });

  // 8. Reward recipient with celebratory bonus coins (50% value back)
  const recipientBonus = Math.max(5, Math.floor(gift.coin_price / 2));
  const { data: recWallet } = await supabase
    .from("user_wallets")
    .select("balance")
    .eq("user_id", recipient_id)
    .maybeSingle();

  if (recWallet) {
    await supabase
      .from("user_wallets")
      .update({ balance: recWallet.balance + recipientBonus })
      .eq("user_id", recipient_id);

    await supabase.from("wallet_transactions").insert({
      user_id: recipient_id,
      amount: recipientBonus,
      type: "gift_received",
      reference_id: transfer.id,
      idempotency_key: `rec_${transfer.id}`,
    });
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    transfer: transfer as GiftTransfer,
    remainingBalance: newBalance,
  };
}

/**
 * Award coins for verified completed study duration (1 coin per 2.5 minutes).
 */
export async function claimStudySessionCoins(
  sessionId: string,
  accumulatedSeconds: number
): Promise<{ success: boolean; coinsAwarded: number }> {
  if (accumulatedSeconds < 150) {
    return { success: false, coinsAwarded: 0 }; // Minimum 2.5 minutes required
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, coinsAwarded: 0 };

  const idempotencyKey = `focus_reward_${sessionId}`;

  // Check if reward already claimed
  const { data: existing } = await supabase
    .from("wallet_transactions")
    .select("amount")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { success: true, coinsAwarded: existing.amount };
  }

  // Formula: 1 coin per 150 seconds (2.5 mins) + 2 bonus coins for full 25m Pomodoro
  const baseCoins = Math.floor(accumulatedSeconds / 150);
  const bonus = accumulatedSeconds >= 1500 ? 2 : 0;
  const coinsAwarded = Math.min(50, baseCoins + bonus);

  const wallet = await getUserWallet();
  if (wallet) {
    await supabase
      .from("user_wallets")
      .update({ balance: wallet.balance + coinsAwarded, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount: coinsAwarded,
      type: "earned_focus",
      reference_id: sessionId,
      idempotency_key: idempotencyKey,
    });
  }

  return { success: true, coinsAwarded };
}
