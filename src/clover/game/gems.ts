// @ts-nocheck
/**
 * Clover gems + forever upgrades.
 *
 * Gems are minted from the clovers still in your pocket when you rebirth. The
 * leftover is squeezed through a square root first, so hoarding a hundred
 * times more clovers only pays ten times more gems: pushing your luck is
 * rewarded, but farming one more hour never outpaces actually rebirthing.
 *
 * Forever upgrades are bought with gems and survive every rebirth and reset,
 * so a gem spent is a decision that lasts the whole save.
 */
import type { IconName } from "./icons";

/** Leftover clovers are divided by this after the square root. */
export const GEM_DIVISOR = 50;
/** Safety valve: no single rebirth can mint more than this, however edited the save. */
export const MAX_GEMS_PER_REBIRTH = 1200;

/** How many gems a pile of leftover clovers is worth at the anvil. */
export function gemsForLeftover(leftover: number): number {
  if (!Number.isFinite(leftover) || leftover <= 0) return 0;
  return Math.min(MAX_GEMS_PER_REBIRTH, Math.floor(Math.sqrt(leftover) / GEM_DIVISOR));
}

export type ForeverId = "gemLuck" | "gemValue" | "gemShine" | "gemFortune" | "gemSpeed" | "gemYield";
export type ForeverLevels = Record<ForeverId, number>;

export type ForeverDef = {
  id: ForeverId;
  name: string;
  blurb: string;
  icon: IconName;
  max: number;
  /** Gem price to go from this level to the next. */
  cost: (level: number) => number;
  effect: (level: number) => string;
};

/* ---------------- effect sizes, one source of truth ---------------- */

export const GEM_LUCK = 0.06;
export const GEM_VALUE = 0.1;
export const GEM_SHINE = 0.08;
export const GEM_FORTUNE = 0.02;
export const GEM_SPEED = 0.03;
export const GEM_YIELD = 0.12;

const price = (base: number, growth: number) => (level: number) => Math.round(base * growth ** level);

/** Six cuts of the same stone. Small numbers, stacked forever. */
export const FOREVER: ForeverDef[] = [
  {
    id: "gemLuck", name: "PRISM LUCK", blurb: "Better odds on every rarity, forever", icon: "gemStar",
    max: 5, cost: price(12, 2.15), effect: (l) => `x${(1 + GEM_LUCK * l).toFixed(2)} LUCK`,
  },
  {
    id: "gemValue", name: "PRISM VALUE", blurb: "Every clover pays more, forever", icon: "gemCoin",
    max: 5, cost: price(14, 2.15), effect: (l) => `x${(1 + GEM_VALUE * l).toFixed(2)} VALUE`,
  },
  {
    id: "gemShine", name: "PRISM SHINE", blurb: "Shiny, crystal, cursed and glitched find you faster", icon: "gemDiamond",
    max: 5, cost: price(16, 2.15), effect: (l) => `x${(1 + GEM_SHINE * l).toFixed(2)} VARIANT ODDS`,
  },
  {
    id: "gemFortune", name: "PRISM FORTUNE", blurb: "A permanent raise to your crit chance", icon: "gemDie",
    max: 4, cost: price(20, 2.15), effect: (l) => `+${Math.round(GEM_FORTUNE * l * 100)}% CRIT`,
  },
  {
    id: "gemSpeed", name: "PRISM SPIN", blurb: "The auto spinner wastes less time", icon: "gemBolt",
    max: 4, cost: price(24, 2.15), effect: (l) => `-${Math.round(GEM_SPEED * l * 100)}% AUTO PAUSE`,
  },
  {
    id: "gemYield", name: "PRISM MINT", blurb: "Every rebirth mints more gems from your leftovers", icon: "gemCluster",
    max: 5, cost: price(28, 2.15), effect: (l) => `+${Math.round(GEM_YIELD * l * 100)}% GEM YIELD`,
  },
];

export const foreverDef = (id: ForeverId): ForeverDef => FOREVER.find((item) => item.id === id)!;

export const newForeverLevels = (): ForeverLevels => ({
  gemLuck: 0, gemValue: 0, gemShine: 0, gemFortune: 0, gemSpeed: 0, gemYield: 0,
});

/** Clamped level read, so a damaged save can't push an upgrade past its cap. */
export function foreverLevel(levels: ForeverLevels | undefined, id: ForeverId): number {
  const def = foreverDef(id);
  const raw = Math.floor(Number(levels?.[id] ?? 0));
  return Number.isFinite(raw) ? Math.max(0, Math.min(def.max, raw)) : 0;
}

export const foreverCost = (id: ForeverId, level: number) => foreverDef(id).cost(level);

/* ---------------- the bonuses, applied across the game ---------------- */

export const foreverLuck = (levels: ForeverLevels) => 1 + GEM_LUCK * foreverLevel(levels, "gemLuck");
export const foreverValue = (levels: ForeverLevels) => 1 + GEM_VALUE * foreverLevel(levels, "gemValue");
export const foreverShine = (levels: ForeverLevels) => 1 + GEM_SHINE * foreverLevel(levels, "gemShine");
export const foreverFortune = (levels: ForeverLevels) => GEM_FORTUNE * foreverLevel(levels, "gemFortune");
export const foreverSpeed = (levels: ForeverLevels) => 1 - GEM_SPEED * foreverLevel(levels, "gemSpeed");
export const foreverYield = (levels: ForeverLevels) => 1 + GEM_YIELD * foreverLevel(levels, "gemYield");
