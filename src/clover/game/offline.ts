// @ts-nocheck
import { autoUnlocked, passiveRollsPerSecond, expectedPayout, type OfflineReward, type Save } from "./data";
import { activePotion, expirePotion } from "./potions";

/** Offline pay is half of what you'd earn playing actively, measured against the active rate. */
export const OFFLINE_EFFICIENCY = 0.5;
export const OFFLINE_CAP_MS = 16 * 60 * 60 * 1000;
export const OFFLINE_MIN_MS = 30 * 1000;
const MAX = Number.MAX_SAFE_INTEGER;

export function hasOfflineEarnings(save: Save): boolean {
  return save.auto && autoUnlocked(save);
}

/** Clovers per second while away: unlocked auto rolls at the offline rate. */
export function offlineCloversPerSecond(save: Save, now = Date.now()): number {
  if (!hasOfflineEarnings(save)) return 0;
  return expectedPayout(save, now) * passiveRollsPerSecond(save, now) * OFFLINE_EFFICIENCY;
}

export function settleOfflineEarnings(save: Save, now: number): Save {
  if (!Number.isFinite(now) || now <= 0) return save;
  const previous = Number.isFinite(save.lastActiveAt) && save.lastActiveAt > 0 ? save.lastActiveAt : now;
  const awayMs = Math.max(0, now - previous);
  const next: Save = expirePotion({ ...save, lastActiveAt: Math.max(previous, now) }, now);
  if (awayMs < OFFLINE_MIN_MS || !hasOfflineEarnings(save)) return next;

  const pending = save.offlineReward;
  const remaining = Math.max(0, OFFLINE_CAP_MS - (pending?.creditedMs ?? 0));
  const creditedMs = Math.min(remaining, awayMs);
  const active = activePotion(save, previous);
  const boostedMs = active ? Math.max(0, Math.min(previous + creditedMs, active.expiresAt) - previous) : 0;
  const plainSave = { ...save, potions: { ...save.potions, active: null } };
  // Pro-rate the *earlier* part of the absence where the potion was still live.
  // Any unused duration is discarded after expiry; a closed tab does not refill it.
  const baseRate = offlineCloversPerSecond(plainSave, previous);
  const boostedRate = offlineCloversPerSecond(save, previous);
  const amount = Math.min(MAX, Math.floor((baseRate * (creditedMs - boostedMs) + boostedRate * boostedMs) / 1000));
  if (amount < 1 && !pending) return next;

  const reward: OfflineReward = {
    id: amount > 0 ? `offline:${previous}:${now}` : pending!.id,
    amount: Math.min(MAX, (pending?.amount ?? 0) + amount),
    awayMs: Math.min(365 * 86400000, (pending?.awayMs ?? 0) + awayMs),
    creditedMs: Math.min(OFFLINE_CAP_MS, (pending?.creditedMs ?? 0) + creditedMs),
    capped: pending?.capped === true || awayMs > remaining,
    createdAt: now,
  };
  return { ...next, offlineReward: reward };
}

export function redeemOfflineReward(save: Save, receiptId: string, now = Date.now()): Save {
  const reward = save.offlineReward;
  if (!reward || reward.id !== receiptId) return save;
  return {
    ...save,
    clovers: Math.min(Number.MAX_VALUE, save.clovers + reward.amount),
    totalEarned: Math.min(Number.MAX_VALUE, save.totalEarned + reward.amount),
    totalOfflineEarned: Math.min(Number.MAX_VALUE, save.totalOfflineEarned + reward.amount),
    offlineReward: null,
    lastActiveAt: Math.max(save.lastActiveAt, now),
  };
}

export function formatAwayTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds / 3600) % 24;
  const minutes = Math.floor(seconds / 60) % 60;
  if (days > 0) return `${days}d${hours > 0 ? ` ${hours}h` : ""}`;
  if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  if (minutes > 0) return `${minutes}m${seconds % 60 > 0 ? ` ${seconds % 60}s` : ""}`;
  return `${seconds}s`;
}