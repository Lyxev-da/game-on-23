// @ts-nocheck
/**
 * Quests: six that reset every local day, six that reset every local week.
 * Each pays tickets once you press CLAIM. Tickets buy clover packs in the shop.
 *
 * Targets scale with rebirths so they stay meaningful without becoming
 * impossible, and every quest can be finished by simply rolling.
 */
import { RARITIES, TIERS, foundKey, rebirthCost, type RollResult, type Save } from "./data";
import type { IconName } from "./icons";

export type QuestKind = "rolls" | "earn" | "lucky" | "crit" | "shiny" | "rarity" | "discover";
export type QuestScope = "daily" | "weekly";
export type Quest = { kind: QuestKind; target: number; progress: number; reward: number; claimed: boolean; minChance?: number };
export type QuestState = { day: string; week: string; daily: Quest[]; weekly: Quest[]; dailyBonus: boolean; weeklyBonus: boolean };

/** Extra tickets for finishing and claiming all six of a set. */
export const BONUS_TICKETS: Record<QuestScope, number> = { daily: 8, weekly: 50 };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local calendar day, so the reset happens at the player's own midnight. */
export const dayKey = (now = Date.now()) => ymd(new Date(now));

/** Local Monday of the current week. */
export function weekKey(now = Date.now()): string {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7;
  return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - back));
}

export function msUntilDayReset(now = Date.now()): number {
  const d = new Date(now);
  return Math.max(0, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - now);
}

export function msUntilWeekReset(now = Date.now()): number {
  const d = new Date(now);
  const forward = 7 - ((d.getDay() + 6) % 7);
  return Math.max(0, new Date(d.getFullYear(), d.getMonth(), d.getDate() + forward).getTime() - now);
}

const DAILY_STEPS = [60, 180, 450, 900, 1800];
const WEEKLY_STEPS = [180, 450, 900, 1800, 3500];

export const QUEST_INFO: Record<QuestKind, { title: string; icon: IconName }> = {
  rolls: { title: "ROLLER", icon: "dice" },
  earn: { title: "TYCOON", icon: "coin" },
  lucky: { title: "LUCKY STREAK", icon: "luckyRoll" },
  crit: { title: "CRITICAL HITTER", icon: "star" },
  shiny: { title: "SHINY HUNTER", icon: "shine" },
  rarity: { title: "RARE HUNTER", icon: "crown" },
  discover: { title: "EXPLORER", icon: "book" },
};

function build(scope: QuestScope, s: Save): Quest[] {
  const r = s.rebirths;
  const week = scope === "weekly";
  const mult = week ? 6 : 1;
  const earnBase = Math.max(2000, Math.round(rebirthCost(r) * 0.3));
  const undiscovered = TIERS.reduce((n, _t, i) => n + (s.found[foundKey(i, "normal")] > 0 ? 0 : 1), 0);
  const steps = week ? WEEKLY_STEPS : DAILY_STEPS;
  const step = steps[Math.min(steps.length - 1, Math.floor(r / 2))];
  const q = (kind: QuestKind, target: number, reward: number, extra: Partial<Quest> = {}): Quest => ({ kind, target, progress: 0, reward, claimed: false, ...extra });
  return week
    ? [
        q("rolls", (100 + 20 * Math.min(r, 6)) * mult, 25),
        q("earn", earnBase * 5, 25),
        // Falls back to crits once every normal clover has been found, so it never becomes impossible.
        undiscovered > 0 ? q("discover", Math.min(5, undiscovered), 30) : q("lucky", 15, 30),
        q("crit", 40, 30),
        q("shiny", 20, 35),
        q("rarity", 3, 40, { minChance: step }),
      ]
    : [
        q("rolls", 100 + 20 * Math.min(r, 6), 3),
        q("earn", earnBase, 3),
        q("lucky", 3, 3),
        q("crit", 5, 4),
        q("shiny", 3, 4),
        q("rarity", 1, 5, { minChance: step }),
      ];
}

/** Rolls a fresh daily and/or weekly set when the day or week has changed. */
export function ensureQuests(s: Save, now = Date.now()): Save {
  const day = dayKey(now);
  const week = weekKey(now);
  const q = s.quests;
  if (q && q.day === day && q.week === week) return s;
  return {
    ...s,
    quests: {
      day,
      week,
      daily: q && q.day === day ? q.daily : build("daily", s),
      weekly: q && q.week === week ? q.weekly : build("weekly", s),
      dailyBonus: q && q.day === day ? q.dailyBonus : false,
      weeklyBonus: q && q.week === week ? q.weeklyBonus : false,
    },
  };
}

export const isDone = (quest: Quest) => quest.progress >= quest.target;

function advance(quest: Quest, r: RollResult): number {
  switch (quest.kind) {
    case "rolls": return 1;
    case "earn": return r.value;
    case "lucky": return r.lucky ? 1 : 0;
    case "crit": return r.crit ? 1 : 0;
    case "shiny": return r.variant !== "normal" ? 1 : 0;
    case "rarity": return TIERS[r.tier].chance >= (quest.minChance ?? Infinity) ? 1 : 0;
    case "discover": return r.isNew ? 1 : 0;
  }
}

/** Counts one roll toward every open quest. Nothing is paid until the player claims it. */
export function trackQuests(s: Save, r: RollResult, now = Date.now()): { save: Save; ready: Quest[] } {
  const fresh = ensureQuests(s, now);
  const state = fresh.quests!;
  const ready: Quest[] = [];
  const step = (list: Quest[]) => list.map((quest) => {
    if (isDone(quest)) return quest;
    const progress = Math.min(quest.target, quest.progress + advance(quest, r));
    if (progress === quest.progress) return quest;
    const next = { ...quest, progress };
    if (isDone(next)) ready.push(next);
    return next;
  });
  const daily = step(state.daily);
  const weekly = step(state.weekly);
  if (daily.every((quest, i) => quest === state.daily[i]) && weekly.every((quest, i) => quest === state.weekly[i])) return { save: fresh, ready };
  return { save: { ...fresh, quests: { ...state, daily, weekly } }, ready };
}

const list = (s: Save, scope: QuestScope) => s.quests?.[scope] ?? [];
export const questsDone = (s: Save, scope: QuestScope) => list(s, scope).filter(isDone).length;
export const bonusReady = (s: Save, scope: QuestScope) =>
  !!s.quests && !(scope === "daily" ? s.quests.dailyBonus : s.quests.weeklyBonus) && list(s, scope).length === 6 && list(s, scope).every((quest) => quest.claimed);

/** How many things are waiting to be claimed (quests plus bonuses). */
export function claimableCount(s: Save): number {
  let n = 0;
  for (const scope of ["daily", "weekly"] as const) {
    n += list(s, scope).filter((quest) => isDone(quest) && !quest.claimed).length;
    if (bonusReady(s, scope)) n++;
  }
  return n;
}

const pay = (s: Save, tickets: number): Save => ({ ...s, tickets: s.tickets + tickets, totalTickets: s.totalTickets + tickets });

export function claimQuest(s: Save, scope: QuestScope, index: number): { save: Save; tickets: number } | null {
  const state = s.quests;
  const quest = state?.[scope][index];
  if (!state || !quest || !isDone(quest) || quest.claimed) return null;
  const next = state[scope].map((item, i) => (i === index ? { ...item, claimed: true } : item));
  return { save: pay({ ...s, quests: { ...state, [scope]: next } }, quest.reward), tickets: quest.reward };
}

export function claimBonus(s: Save, scope: QuestScope): { save: Save; tickets: number } | null {
  if (!bonusReady(s, scope) || !s.quests) return null;
  const tickets = BONUS_TICKETS[scope];
  return { save: pay({ ...s, quests: { ...s.quests, [scope === "daily" ? "dailyBonus" : "weeklyBonus"]: true } }, tickets), tickets };
}

/** Claims everything that is ready in one go. */
export function claimAll(s: Save): { save: Save; tickets: number; count: number } | null {
  let save = s, tickets = 0, count = 0;
  for (const scope of ["daily", "weekly"] as const) {
    for (let i = 0; i < 6; i++) {
      const claim = claimQuest(save, scope, i);
      if (claim) { save = claim.save; tickets += claim.tickets; count++; }
    }
    const bonus = claimBonus(save, scope);
    if (bonus) { save = bonus.save; tickets += bonus.tickets; count++; }
  }
  return count ? { save, tickets, count } : null;
}

const rarityLabel = (minChance: number) => [...RARITIES].reverse().find((g) => minChance >= g.minChance)?.label ?? "RARE";

export function describeQuest(q: Quest, fmt: (n: number) => string): string {
  switch (q.kind) {
    case "rolls": return `ROLL ${fmt(q.target)} TIMES`;
    case "earn": return `EARN ${fmt(q.target)} CLOVERS`;
    case "lucky": return `LAND ${fmt(q.target)} LUCKY ROLLS`;
    case "crit": return `LAND ${fmt(q.target)} CRIT ROLLS`;
    case "shiny": return `FIND ${fmt(q.target)} SHINY OR BETTER`;
    case "discover": return `DISCOVER ${fmt(q.target)} NEW ${q.target === 1 ? "CLOVER" : "CLOVERS"}`;
    case "rarity": {
      const label = rarityLabel(q.minChance ?? 60);
      return `FIND ${fmt(q.target)} ${label} OR RARER`;
    }
  }
}

const KINDS: QuestKind[] = ["rolls", "earn", "lucky", "crit", "shiny", "rarity", "discover"];

function sanitizeList(raw: unknown): Quest[] | null {
  if (!Array.isArray(raw) || raw.length !== 6) return null;
  const out: Quest[] = [];
  for (const item of raw as Quest[]) {
    if (!item || !KINDS.includes(item.kind)) return null;
    const target = Math.max(1, Math.floor(Number(item.target) || 1));
    out.push({
      kind: item.kind,
      target,
      progress: Math.max(0, Math.min(target, Math.floor(Number(item.progress) || 0))),
      reward: Math.max(0, Math.min(1000, Math.floor(Number(item.reward) || 0))),
      claimed: item.claimed === true && Number(item.progress) >= target,
      ...(item.minChance ? { minChance: Number(item.minChance) } : {}),
    });
  }
  return out;
}

/** Clamps a stored quest state so a damaged save can't break the panel. */
export function sanitizeQuests(raw: unknown): QuestState | null {
  const q = raw as QuestState;
  if (!q || typeof q.day !== "string" || typeof q.week !== "string" || q.day.length > 12 || q.week.length > 12) return null;
  const daily = sanitizeList(q.daily);
  const weekly = sanitizeList(q.weekly);
  if (!daily || !weekly) return null;
  return { day: q.day, week: q.week, daily, weekly, dailyBonus: q.dailyBonus === true, weeklyBonus: q.weeklyBonus === true };
}
