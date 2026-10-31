// @ts-nocheck
/** Six repeatable clover packs, shaped after the reference 3x2 shop grid. */
export type CloverPackId = "150k" | "1m" | "10m" | "50m" | "500m" | "1b";
export type CloverPack = { id: CloverPackId; amount: number; tickets: number };

export const CLOVER_PACKS: CloverPack[] = [
  { id: "150k", amount: 150_000, tickets: 72 },
  { id: "1m", amount: 1_000_000, tickets: 225 },
  { id: "10m", amount: 10_000_000, tickets: 630 },
  { id: "50m", amount: 50_000_000, tickets: 1350 },
  { id: "500m", amount: 500_000_000, tickets: 1800 },
  { id: "1b", amount: 1_000_000_000, tickets: 2700 },
];

export const packFor = (id: CloverPackId) => CLOVER_PACKS.find((pack) => pack.id === id)!;

/** Tickets buy clovers instantly. Packs are repeatable; tickets are spent only on success. */
export function buyCloverPack(save: { tickets: number; clovers: number; totalEarned: number }, id: CloverPackId) {
  const pack = packFor(id);
  if (!pack || Math.floor(save.tickets) < pack.tickets) return null;
  return {
    ...save,
    tickets: save.tickets - pack.tickets,
    clovers: Math.min(Number.MAX_SAFE_INTEGER, save.clovers + pack.amount),
    totalEarned: Math.min(Number.MAX_SAFE_INTEGER, save.totalEarned + pack.amount),
  };
}

/* ---------------- luck doubler ---------------- */

/** x1 -> x2 -> x4 ... -> x4096. Twelve doublings, then it is maxed. */
export const LUCK_DOUBLER_MAX_LEVEL = 12;
export const luckDoublerMultiplier = (level: number) => 2 ** Math.max(0, Math.min(LUCK_DOUBLER_MAX_LEVEL, Math.floor(level || 0)));
/** Ticket price for the next doubling: 3, 6, 12 ... every step costs double. */
export const luckDoublerCost = (level: number) => 3 * 2 ** Math.max(0, Math.min(LUCK_DOUBLER_MAX_LEVEL, Math.floor(level || 0)));
export const luckDoublerMaxed = (level: number) => Math.floor(level || 0) >= LUCK_DOUBLER_MAX_LEVEL;

/** Doubles your luck permanently; tickets are only spent on success. */
export function buyLuckDoubler<T extends { tickets: number; luckDoubler: number }>(save: T): T | null {
  const level = Math.max(0, Math.min(LUCK_DOUBLER_MAX_LEVEL, Math.floor(save.luckDoubler || 0)));
  if (level >= LUCK_DOUBLER_MAX_LEVEL) return null;
  const cost = luckDoublerCost(level);
  if (Math.floor(save.tickets) < cost) return null;
  return { ...save, tickets: save.tickets - cost, luckDoubler: level + 1 };
}
