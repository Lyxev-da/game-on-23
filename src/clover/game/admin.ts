// @ts-nocheck
/**
 * Tester tools. Every helper takes a save and returns a new one, so the panel
 * can apply them through the same commit path as normal play.
 */
import {
  EVENTS, EVENT_DURATION, REBIRTH_MAX, TIERS, UPGRADES, VARIANTS, AUTO_UNLOCK_ROLLS, foundKey, type EventId, type Save,
} from "./data";
import { CHARMS } from "./charms";
import { POTIONS, MAX_POTION_STOCK } from "./potions";
import { MATERIALS } from "./materials";
import { FOREVER } from "./gems";
import { ensureQuests } from "./quests";

const SAFE = Number.MAX_SAFE_INTEGER;
const clampAdd = (a: number, b: number) => Math.max(0, Math.min(SAFE, Math.floor(a + b)));

export const giveClovers = (s: Save, n: number): Save => ({ ...s, clovers: clampAdd(s.clovers, n), totalEarned: n > 0 ? clampAdd(s.totalEarned, n) : s.totalEarned });
export const giveGems = (s: Save, n: number): Save => ({ ...s, cloverGems: clampAdd(s.cloverGems, n), totalGems: n > 0 ? clampAdd(s.totalGems, n) : s.totalGems });
export const giveTickets = (s: Save, n: number): Save => ({ ...s, tickets: clampAdd(s.tickets, n), totalTickets: n > 0 ? clampAdd(s.totalTickets, n) : s.totalTickets });

export const setRebirths = (s: Save, n: number): Save => {
  const rebirths = Math.max(0, Math.min(REBIRTH_MAX, Math.floor(n)));
  return { ...s, rebirths, lifetime: { ...s.lifetime, rebirths: Math.max(s.lifetime.rebirths, rebirths) } };
};

export const giveMaterials = (s: Save, n: number): Save => {
  const materials = { ...s.materials };
  for (const m of MATERIALS) materials[m.id] = clampAdd(materials[m.id] ?? 0, n);
  return { ...s, materials };
};

export const unlockAllCharms = (s: Save): Save => ({ ...s, charms: { ...s.charms, owned: CHARMS.map((c) => c.id) } });

export const givePotions = (s: Save, n = MAX_POTION_STOCK): Save => {
  const bottles = { ...s.potions.bottles };
  for (const p of POTIONS) bottles[p.id] = Math.min(MAX_POTION_STOCK, (bottles[p.id] ?? 0) + n);
  return { ...s, potions: { ...s.potions, bottles } };
};

export const maxShopUpgrades = (s: Save): Save => ({ ...s, upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, u.max])) as Save["upgrades"] });
export const maxForever = (s: Save): Save => ({ ...s, forever: Object.fromEntries(FOREVER.map((f) => [f.id, f.max])) as Save["forever"] });

export function discoverAll(s: Save): Save {
  const found = { ...s.found };
  const firstFound = { ...s.firstFound };
  const now = Date.now();
  TIERS.forEach((_t, i) => VARIANTS.forEach((v) => {
    const key = foundKey(i, v);
    if (!(found[key] > 0)) { found[key] = 1; firstFound[key] = now; }
  }));
  return { ...s, found, firstFound, best: TIERS.length - 1 };
}

export const unlockAuto = (s: Save): Save => ({ ...s, lifetime: { ...s.lifetime, manualRolls: Math.max(s.lifetime.manualRolls, AUTO_UNLOCK_ROLLS) } });

/** Fills every quest's progress so each one can be claimed. */
export function completeQuests(s: Save): Save {
  const ready = ensureQuests(s);
  const q = ready.quests!;
  const fill = (list) => list.map((quest) => ({ ...quest, progress: quest.target }));
  return { ...ready, quests: { ...q, daily: fill(q.daily), weekly: fill(q.weekly) } };
}

/** Throws today's quests away and rolls a clean set. */
export const resetQuests = (s: Save): Save => ensureQuests({ ...s, quests: null });

export const startEvent = (s: Save, id: EventId): Save => {
  const now = Date.now();
  return { ...s, event: { id, startedAt: now, endsAt: now + EVENT_DURATION } };
};
export const endEvent = (s: Save): Save => ({ ...s, event: null, nextEventAt: Date.now() + 60000 });

export const EVENT_IDS = EVENTS.map((e) => e.id);

/** One-click tester save: plenty of clovers, gems, tickets and every unlock. */
export function giveEverything(s: Save): Save {
  let next = setRebirths(s, REBIRTH_MAX);
  next = giveClovers(next, 1e15);
  next = giveGems(next, 1e6);
  next = giveTickets(next, 1e5);
  next = unlockAuto(next);
  next = maxShopUpgrades(next);
  next = maxForever(next);
  next = unlockAllCharms(next);
  next = givePotions(next, 99);
  next = giveMaterials(next, 1e6);
  next = discoverAll(next);
  next = completeQuests(next);
  return next;
}
