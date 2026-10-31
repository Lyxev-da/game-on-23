// @ts-nocheck
import { charmBonuses, newCharmState, sanitizeCharmState, type CharmState } from "./charms";
import {
  FOREVER, foreverFortune, foreverLevel, foreverLuck, foreverShine, foreverSpeed, foreverValue, foreverYield,
  gemsForLeftover, newForeverLevels, type ForeverId, type ForeverLevels,
} from "./gems";
import { newPotionState, sanitizePotionState, potionBonuses, type PotionState } from "./potions";
import { materialFromClover, sanitizeMaterials, type MaterialBag, type MaterialId } from "./materials";
import { sanitizeQuests, type QuestState } from "./quests";
import { CLOVER_PACKS, LUCK_DOUBLER_MAX_LEVEL, buyLuckDoubler, luckDoublerMultiplier, type CloverPackId } from "./ticketPacks";

export const SAVE_VERSION = 14;

// Rarity is a shared category; each clover still has its own sprite, odds and payout.
export const RARITIES = [
  { id: "common", label: "COMMON", minChance: 1, color: "#5df25f" },
  { id: "uncommon", label: "UNCOMMON", minChance: 4, color: "#3ff2c0" },
  { id: "rare", label: "RARE", minChance: 18, color: "#73d7ff" },
  { id: "epic", label: "EPIC", minChance: 60, color: "#c07bff" },
  { id: "legendary", label: "LEGENDARY", minChance: 180, color: "#ffd23f" },
  { id: "mythic", label: "MYTHIC", minChance: 450, color: "#ff6782" },
  { id: "divine", label: "DIVINE", minChance: 900, color: "#ffcc92" },
  { id: "cosmic", label: "COSMIC", minChance: 1800, color: "#9bb3ff" },
  { id: "secret", label: "SECRET", minChance: 100000, color: "#f6beff" },
] as const;

export type RarityId = (typeof RARITIES)[number]["id"];
export const rarityForChance = (chance: number): (typeof RARITIES)[number] =>
  RARITIES.reduce<(typeof RARITIES)[number]>((group, rarity) => chance >= rarity.minChance ? rarity : group, RARITIES[0]);

export type Tier = {
  id: string;
  label: string;
  rarity: RarityId;
  name: string;
  chance: number;
  value: number;
  hue: number;
  rainbow?: boolean;
  color: string;
  particles: number;
  drama: 0 | 1 | 2 | 3 | 4;
  effect: string;
  added?: boolean;
};

export const TIERS: Tier[] = ([
  { id: "common", name: "Clover", chance: 1, value: 1, hue: 131, color: "#5df25f", particles: 12, drama: 0, effect: "The original four-leaf lucky charm" },
  { id: "uncommon", name: "Mint Clover", chance: 4, value: 4, hue: 162, color: "#3ff2c0", particles: 14, drama: 0, effect: "Dewdrop jewels and etched mint veins" },
  { id: "rare", name: "Frost Clover", chance: 18, value: 18, hue: 199, color: "#73d7ff", particles: 16, drama: 1, effect: "Frozen branches and crystalline ice shards" },
  { id: "epic", name: "Void Clover", chance: 60, value: 70, hue: 272, color: "#c07bff", particles: 18, drama: 1, effect: "Fractured leaves around a dark vortex" },
  { id: "legendary", name: "Golden Clover", chance: 180, value: 240, hue: 45, color: "#ffd23f", particles: 22, drama: 2, effect: "A pixel crown, gold filigree and a royal gleam" },
  { id: "mythic", name: "Ruby Clover", chance: 450, value: 750, hue: 352, color: "#ff6782", particles: 24, drama: 2, effect: "A faceted ruby core with ember sparks" },
  { id: "divine", name: "Seraph Clover", chance: 900, value: 1800, hue: 32, color: "#ffcc92", particles: 28, drama: 3, effect: "An ivory sun rune and a floating halo" },
  { id: "cosmic", name: "Nebula Clover", chance: 1800, value: 4200, hue: 232, color: "#9bb3ff", particles: 30, drama: 3, effect: "A star-speckled nebula and orbiting stardust" },
  { id: "eclipse", name: "Eclipse Clover", chance: 3500, value: 9500, hue: 292, color: "#e7a1ff", particles: 32, drama: 3, effect: "Shadowed leaves encircled by a violet corona" },
  { id: "aurora", name: "Aurora Clover", chance: 6500, value: 20000, hue: 176, color: "#80ffe0", particles: 34, drama: 4, effect: "Northern-light ribbons with a luminous crystal core" },
  { id: "singularity", name: "Singularity Clover", chance: 11000, value: 45000, hue: 258, color: "#c6acff", particles: 36, drama: 4, effect: "A black-hole core and an orbiting accretion disc" },
  { id: "prismatic", name: "Prism Clover", chance: 18000, value: 100000, hue: 0, rainbow: true, color: "#ffffff", particles: 40, drama: 4, effect: "Four gemstone leaves, prismatic shards and a rainbow sheen" },
  { id: "solar", name: "Solar Clover", chance: 26000, value: 150000, hue: 38, color: "#ffd23f", particles: 40, drama: 3, effect: "Sunray flares spill gold across four petals" },
  { id: "moonlit", name: "Moonlit Clover", chance: 40000, value: 230000, hue: 222, color: "#dfe9ff", particles: 42, drama: 3, effect: "A silver crescent bitten from every leaf" },
  { id: "tidal", name: "Tidal Clover", chance: 60000, value: 350000, hue: 192, color: "#7ff0ff", particles: 44, drama: 3, effect: "Rolling waves carved into wet green leaves" },
  { id: "inferno", name: "Inferno Clover", chance: 90000, value: 520000, hue: 16, color: "#ff8a4a", particles: 46, drama: 4, effect: "Stepped flame tongues licking every leaf" },
  { id: "glacier", name: "Glacier Clover", chance: 140000, value: 800000, hue: 205, color: "#9fe2ff", particles: 48, drama: 4, effect: "A hollow ring of ice with cracked, glassy leaves" },
  { id: "sakura", name: "Sakura Clover", chance: 220000, value: 1300000, hue: 330, color: "#ffb3d6", particles: 50, drama: 4, effect: "Bloom-shaped petals drifting with pixel blossoms" },
  { id: "thunder", name: "Thunder Clover", chance: 340000, value: 2100000, hue: 56, color: "#fff36b", particles: 52, drama: 4, effect: "Diamond-cut leaves split by lightning streaks" },
  { id: "verdant", name: "Verdant Clover", chance: 520000, value: 3200000, hue: 118, color: "#9dff8a", particles: 54, drama: 4, effect: "Teardrop leaves wrapped in climbing vines" },
  { id: "obsidian", name: "Obsidian Clover", chance: 800000, value: 5000000, hue: 270, color: "#b48cff", particles: 56, drama: 4, effect: "Squared black glass with violet facets" },
  { id: "celestial", name: "Celestial Clover", chance: 1200000, value: 7500000, hue: 240, color: "#c8d8ff", particles: 58, drama: 4, effect: "Four-point star leaves scattered with starlight" },
  { id: "chrono", name: "Chrono Clover", chance: 1800000, value: 12000000, hue: 35, color: "#e0a84e", particles: 60, drama: 4, effect: "Gear-toothed leaves that turn the clock back" },
  { id: "infinite", name: "Infinite Clover", chance: 4000000, value: 30000000, hue: 290, color: "#ffe27a", particles: 64, drama: 4, effect: "A figure-eight of light carved into every leaf" },
  { id: "dewdrop", name: "Dewdrop Clover", chance: 8, value: 8, hue: 181, color: "#8ceadd", particles: 14, drama: 0, effect: "Pearl-edged leaves holding four tiny drops of morning dew", added: true },
  { id: "copper", name: "Copper Clover", chance: 32, value: 36, hue: 23, color: "#e9a07b", particles: 17, drama: 1, effect: "Hammered copper leaves with turquoise patina and riveted veins", added: true },
  { id: "honey", name: "Honey Clover", chance: 110, value: 135, hue: 39, color: "#ffc85e", particles: 20, drama: 1, effect: "Golden honeycomb leaves with amber cells and glossy nectar", added: true },
  { id: "lotus", name: "Lotus Clover", chance: 280, value: 420, hue: 319, color: "#f6a9d5", particles: 23, drama: 2, effect: "Soft rose petals cupping a jade heart and ivory veins", added: true },
  { id: "amethyst", name: "Amethyst Clover", chance: 1200, value: 2600, hue: 266, color: "#b99aff", particles: 29, drama: 3, effect: "Four faceted violet geodes split by pale crystalline seams", added: true },
  { id: "venom", name: "Venom Clover", chance: 4800, value: 14000, hue: 93, color: "#c7f95c", particles: 33, drama: 3, effect: "Black-green leaves with toxic lime veins and acid droplets", added: true },
  { id: "tempest", name: "Tempest Clover", chance: 45000, value: 260000, hue: 207, color: "#9be8ff", particles: 43, drama: 3, effect: "Storm-blue leaves wrapped in silver wind and electric forks", added: true },
  { id: "bloodmoon", name: "Bloodmoon Clover", chance: 2500000, value: 17500000, hue: 351, color: "#ff8295", particles: 62, drama: 4, effect: "Dark wine leaves bearing four scarlet eclipses and lunar sigils", added: true },
  { id: "empyrean", name: "Empyrean Clover", chance: 10000000, value: 80000000, hue: 45, color: "#fff1b8", particles: 72, drama: 4, effect: "Ivory-gold celestial petals with sapphire inlays and a radiant seal", added: true },
  { id: "starfall", name: "Starfall Clover", chance: 2.5, value: 3, hue: 246, color: "#aebdff", particles: 15, drama: 0, effect: "Midnight-blue leaves crossed by a little falling star", added: true },
  { id: "moss", name: "Moss Clover", chance: 10, value: 12, hue: 139, color: "#93c979", particles: 16, drama: 0, effect: "Velvet moss, tiny fern curls and dew-bright spores", added: true },
  { id: "marigold", name: "Marigold Clover", chance: 70, value: 95, hue: 34, color: "#ffbd4a", particles: 19, drama: 1, effect: "A warm marigold rosette with ember-gold petal seams", added: true },
  { id: "coral", name: "Coral Clover", chance: 210, value: 340, hue: 8, color: "#ff8878", particles: 21, drama: 1, effect: "Reef-pink leaves branching into tiny coral fans", added: true },
  { id: "sapphire", name: "Sapphire Clover", chance: 720, value: 1500, hue: 216, color: "#65a9ff", particles: 27, drama: 2, effect: "Royal-blue facets with a white sapphire glint", added: true },
  { id: "phantom", name: "Phantom Clover", chance: 8500, value: 32000, hue: 278, color: "#c5a8ff", particles: 35, drama: 3, effect: "Lavender afterimages drift one pixel behind each leaf", added: true },
  { id: "rift", name: "Rift Clover", chance: 32000, value: 190000, hue: 193, color: "#67f0e0", particles: 41, drama: 3, effect: "A turquoise fault-line opens through four dark petals", added: true },
  { id: "stormglass", name: "Stormglass Clover", chance: 180000, value: 1300000, hue: 202, color: "#b4eeff", particles: 49, drama: 4, effect: "Sea-glass leaves striped by silver rain and lightning", added: true },
  { id: "crownfire", name: "Crownfire Clover", chance: 900000, value: 9000000, hue: 17, color: "#ff9b55", particles: 59, drama: 4, effect: "A small crown of clean white-hot flame above each heart", added: true },
  { id: "eventide", name: "Eventide Clover", chance: 2700000, value: 26000000, hue: 282, color: "#d3a3ff", particles: 68, drama: 4, effect: "Violet dusk bands settle beneath the first evening stars", added: true },
  { id: "firefly", name: "Firefly Clover", chance: 3, value: 3, hue: 92, color: "#c9ff79", particles: 13, drama: 0, effect: "Tiny lanterns glow in the four leaves after dusk", added: true },
  { id: "fern", name: "Fern Clover", chance: 12, value: 14, hue: 145, color: "#77d69a", particles: 17, drama: 0, effect: "Paired fern fronds curl along each leaf vein", added: true },
  { id: "sunstone", name: "Sunstone Clover", chance: 90, value: 115, hue: 27, color: "#ffad58", particles: 20, drama: 1, effect: "Apricot crystal plates catch a warm inner sunrise", added: true },
  { id: "bellflower", name: "Bellflower Clover", chance: 330, value: 490, hue: 292, color: "#bb98e8", particles: 24, drama: 2, effect: "Violet bell-shaped blooms ring the four-leaf heart", added: true },
  { id: "garnet", name: "Garnet Clover", chance: 1000, value: 2200, hue: 344, color: "#e34c70", particles: 29, drama: 3, effect: "Deep red gemstone facets converge on a bright core", added: true },
  { id: "mirage", name: "Mirage Clover", chance: 9500, value: 45000, hue: 188, color: "#7ee5d5", particles: 37, drama: 3, effect: "Two heat-hazed afterimages shimmer around clear mint leaves", added: true },
  { id: "paradox", name: "Paradox Clover", chance: 38000, value: 240000, hue: 320, color: "#ff82ca", particles: 44, drama: 3, effect: "Opposite-color halves join along a single impossible seam", added: true },
  { id: "wildfire", name: "Wildfire Clover", chance: 650000, value: 6300000, hue: 8, color: "#ff7350", particles: 56, drama: 4, effect: "Four bright ember trails coil around a charcoal leaf edge", added: true },
  { id: "archangel", name: "Archangel Clover", chance: 1500000, value: 14000000, hue: 208, color: "#d9f3ff", particles: 64, drama: 4, effect: "Feather-white leaves carry a fine blue-gold halo pattern", added: true },
  { id: "null", name: "Null Clover", chance: 3000000, value: 32000000, hue: 272, color: "#b6a1d4", particles: 70, drama: 4, effect: "A silent violet outline surrounds four ink-dark empty leaves", added: true },
] satisfies Omit<Tier, "label" | "rarity">[])
  .sort((a, b) => a.chance - b.chance)
  .map((clover) => {
    const rarity = rarityForChance(clover.chance);
    return { ...clover, rarity: rarity.id, label: rarity.label };
  });

/* ---------------- variants ---------------- */

export type Variant = "normal" | "shiny" | "crystal" | "cursed" | "glitched";
export const VARIANTS: Variant[] = ["normal", "shiny", "crystal", "cursed", "glitched"];

export const SHINY_VALUE = 5;
export const BASE_SHINY = 1 / 50;
/** Crystal: 25x the clovers, 500x harder than shiny to roll. */
export const CRYSTAL_VALUE = 25;
export const CRYSTAL_RARITY = 500;
export const CRYSTAL_REBIRTHS = 5;
/** Cursed: 100x the clovers, 10x harder than crystal to roll. Unlocks at 10 rebirths. */
export const CURSED_VALUE = 100;
export const CURSED_RARITY = 10;
export const CURSED_REBIRTHS = 10;
/** Glitched: 400x payout, five times rarer than cursed, unlocked at rebirth 15. */
export const GLITCHED_VALUE = 400;
export const GLITCHED_RARITY = 5;
export const GLITCHED_REBIRTHS = 15;
/** Glitched remains the final variant unlock for the expanded rarity ladder. */

export const TOTAL_ENTRIES = TIERS.length * VARIANTS.length;
export const AUTO_UNLOCK_ROLLS = 75;
export const BASE_LUCKY_ROLLS = 50;
export const LUCKY_PACE_STEP = 5;
export const LUCKY_POWER_STEP = 0.25;
/** Pause between spins for the unlocked auto roller; Auto Speed shortens it. */
export const FREE_AUTO_DELAY = 1500;
export const AUTO_BASE_DELAY = 800;
export const MIN_AUTO_DELAY = 200;
/** Every roll is one 3.2s spin of the rarity rail; nothing else can roll meanwhile. */
export const ROLL_DURATION = 3200;

/* ---------------- rebirth ---------------- */

export const REBIRTH_BASE_COST = 250000;
export const REBIRTH_COST_GROWTH = 2.2;
export const REBIRTH_MAX = 50;
/** +35% luck and +25% clover value per rebirth, forever. */
export const REBIRTH_LUCK = 0.35;
export const REBIRTH_VALUE = 0.25;

export const rebirthCost = (rebirths: number) => Math.round(REBIRTH_BASE_COST * REBIRTH_COST_GROWTH ** rebirths);
export const rebirthLuck = (rebirths: number) => 1 + REBIRTH_LUCK * rebirths;
export const rebirthValue = (rebirths: number) => 1 + REBIRTH_VALUE * rebirths;

/** The clovers still in your pocket once the rebirth is paid for. */
export const rebirthLeftover = (s: Save) => Math.max(0, Math.floor(s.clovers) - rebirthCost(s.rebirths));

/**
 * Gems minted at a rebirth: the leftover clovers, compressed by a square root
 * so hoarding can never outpace actually rebirthing, then lifted by the mint.
 */
export function gemsForRebirth(s: Save): number {
  return Math.floor(gemsForLeftover(rebirthLeftover(s)) * foreverYield(s.forever));
}

/* ---------------- world events ---------------- */

export type EventId = "golden" | "surge" | "shimmer";
export type EventDef = { id: EventId; name: string; blurb: string; icon: string; hue: number; luck: number; value: number; shiny: number };

/** Short, rare windows that make a session feel different. Never active offline. */
export const EVENTS: EventDef[] = [
  { id: "golden", name: "GOLDEN HOUR", blurb: "EVERY CLOVER PAYS DOUBLE", icon: "coin", hue: 45, luck: 1, value: 2, shiny: 1 },
  { id: "surge", name: "LUCK SURGE", blurb: "DOUBLE LUCK ON EVERY ROLL", icon: "star", hue: 140, luck: 2, value: 1, shiny: 1 },
  { id: "shimmer", name: "SHINY STORM", blurb: "TRIPLE SHINY CHANCE", icon: "shine", hue: 52, luck: 1, value: 1, shiny: 3 },
];
export const EVENT_DURATION = 2 * 60 * 1000;
/** Gap between events, measured from the end of the last one. */
export const EVENT_GAP_MIN = 6 * 60 * 1000;
export const EVENT_GAP_MAX = 10 * 60 * 1000;
export const eventFor = (id: EventId) => EVENTS.find((e) => e.id === id)!;
export const activeEvent = (s: Save, now = Date.now()) =>
  s.event && s.event.startedAt <= now && s.event.endsAt > now ? eventFor(s.event.id) : null;
const eventLuck = (s: Save, now: number) => activeEvent(s, now)?.luck ?? 1;
const eventValue = (s: Save, now: number) => activeEvent(s, now)?.value ?? 1;
const eventShiny = (s: Save, now: number) => activeEvent(s, now)?.shiny ?? 1;
export const nextEventGap = () => EVENT_GAP_MIN + Math.random() * (EVENT_GAP_MAX - EVENT_GAP_MIN);

/** Starts a random event when one is due; returns the save unchanged otherwise. */
export function maybeStartEvent(s: Save, now = Date.now()): Save {
  if (activeEvent(s, now)) return s;
  if (s.event && s.event.endsAt <= now) return { ...s, event: null, nextEventAt: Math.max(s.nextEventAt, s.event.endsAt + nextEventGap()) };
  if (now < s.nextEventAt) return s;
  const pool = EVENTS.filter((e) => e.id !== s.event?.id);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { ...s, event: { id: pick.id, startedAt: now, endsAt: now + EVENT_DURATION }, nextEventAt: now + EVENT_DURATION + nextEventGap() };
}

/* ---------------- save ---------------- */

export type UpgradeId = "luck" | "auto" | "shiny" | "value" | "crit" | "luckyPace" | "luckyPower" | "crystal" | "cursed" | "glitched";
export type Upgrades = Record<UpgradeId, number>;

export type OfflineReward = {
  id: string;
  amount: number;
  awayMs: number;
  creditedMs: number;
  capped: boolean;
  createdAt: number;
};

export type Save = {
  version: number;
  clovers: number;
  totalEarned: number;
  rolls: number;
  /** Real spins (manual or auto) since the previous lucky roll; survives rebirth. */
  luckyProgress: number;
  upgrades: Upgrades;
  /** Shared crafting resources. Discoveries in `found` are never consumed. */
  materials: MaterialBag;
  charms: CharmState;
  potions: PotionState;
  found: Record<string, number>;
  best: number;
  rebirths: number;
  /** Spent in the shop's forever room. Minted from the clovers left over at a rebirth. */
  cloverGems: number;
  totalGems: number;
  /** Forever upgrades: bought with gems, kept through every rebirth and reset. */
  forever: ForeverLevels;
  /** When each index entry was first discovered (ms since epoch). */
  firstFound: Record<string, number>;
  /** The live world event, if one is running. */
  event: { id: EventId; startedAt: number; endsAt: number } | null;
  /** Wall-clock time the next world event may start. */
  nextEventAt: number;
  /** Six daily and six weekly quests. */
  quests: QuestState | null;
  /** Earned from quests; spent on clover packs in the shop. */
  tickets: number;
  totalTickets: number;
  /** Luck doubler level bought with tickets: x2 per level, up to x4096. Kept through rebirth. */
  luckDoubler: number;
  sound: boolean;
  auto: boolean;
  performance: boolean;
  luckScale: number;
  lastActiveAt: number;
  offlineReward: OfflineReward | null;
  totalOfflineEarned: number;
  lifetime: Lifetime;
};

/** Post-spin pause: 0.80s at level 1, down to 0.20s at level 12. */
export function autoDelay(level: number): number {
  return level <= 0 ? 0 : Math.max(MIN_AUTO_DELAY, Math.round(AUTO_BASE_DELAY * 0.86 ** (level - 1)));
}

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  blurb: string;
  max: number;
  unlockAt?: number;
  cost: (level: number) => number;
  effect: (level: number) => string;
};

const luckMultiplier = (level: number) => 1.09 ** level;

export const BASE_CRYSTAL = 0.002;
export const MAX_CRYSTAL_CHANCE = 0.10;
export const BASE_CURSED = 0.0005;
export const MAX_CURSED_CHANCE = 0.075;
export const BASE_GLITCHED = 0.0001;
export const MAX_GLITCHED_CHANCE = 0.05;

export const UPGRADES: UpgradeDef[] = [
  { id: "luck", name: "LUCK BOOST", blurb: "Compounding luck for the rarest finds", max: 60, cost: (l) => Math.round(15 * 1.3 ** l), effect: (l) => `x${luckMultiplier(l).toFixed(2)}` },
  { id: "value", name: "CLOVER VALUE", blurb: "A permanent boost to every payout", max: 50, cost: (l) => Math.round(40 * 1.33 ** l), effect: (l) => `x${(1 + 0.4 * l).toFixed(1)}` },
  { id: "luckyPace", name: "LUCKY PACE", blurb: "Fewer rolls between lucky spins", max: 6, cost: (l) => Math.round(500 * 1.85 ** l), effect: (l) => `EVERY ${BASE_LUCKY_ROLLS - l * LUCKY_PACE_STEP} ROLLS` },
  { id: "luckyPower", name: "LUCKY POWER", blurb: "More luck on your lucky spin", max: 6, cost: (l) => Math.round(750 * 1.9 ** l), effect: (l) => `x${(2 + l * LUCKY_POWER_STEP).toFixed(2)} LUCK` },
  { id: "auto", name: "AUTO SPEED", blurb: "Shorter pause between automatic spins", max: 12, cost: (l) => Math.round(60 * 1.48 ** l), effect: (l) => `${((ROLL_DURATION + (l > 0 ? autoDelay(l) : FREE_AUTO_DELAY)) / 1000).toFixed(1)}s/ROLL` },
  { id: "shiny", name: "SHINY BOOST", blurb: "Discover shimmering, 5x-value variants", max: 25, cost: (l) => Math.round(250 * 1.42 ** l), effect: (l) => `${Math.round(BASE_SHINY * (1 + 0.3 * l) * 100)}%` },
  { id: "crystal", name: "CRYSTAL BOOST", blurb: "Discover gleaming, 25x-value variants", unlockAt: CRYSTAL_REBIRTHS, max: 25, cost: (l) => Math.round(4000 * 1.45 ** l), effect: (l) => `${(BASE_CRYSTAL * 100 * (1 + 1.96 * l)).toFixed(l === 0 ? 1 : 2).replace(/\\.00$/, "")}%` },
  { id: "cursed", name: "CURSED BOOST", blurb: "Discover shadowy, 100x-value variants", unlockAt: CURSED_REBIRTHS, max: 25, cost: (l) => Math.round(15000 * 1.48 ** l), effect: (l) => `${(BASE_CURSED * 100 * (1 + 5.96 * l)).toFixed(l === 0 ? 2 : 2).replace(/\\.00$/, "")}%` },
  { id: "glitched", name: "GLITCHED BOOST", blurb: "Discover fractured, 400x-value variants", unlockAt: GLITCHED_REBIRTHS, max: 25, cost: (l) => Math.round(50000 * 1.5 ** l), effect: (l) => `${(BASE_GLITCHED * 100 * (1 + 19.96 * l)).toFixed(l === 0 ? 2 : 2).replace(/\\.00$/, "")}%` },
  { id: "crit", name: "CRIT ROLL", blurb: "A chance for a 10x-value payout", max: 20, cost: (l) => Math.round(600 * 1.42 ** l), effect: (l) => `${l * 3}%` },
];

/* ---------------- lifetime stats ---------------- */

/** Stats that survive rebirths, so they are a true all-time record. */
export type Lifetime = {
  rolls: number;
  manualRolls: number;
  shinies: number;
  crystals: number;
  cursed: number;
  glitched: number;
  crits: number;
  discoveries: number;
  rebirths: number;
  biggest: number;
  rarest: { tier: number; tierId?: string; variant: Variant } | null;
  playMs: number;
};

export function newLifetime(): Lifetime {
  return {
    rolls: 0, manualRolls: 0, shinies: 0, crystals: 0, cursed: 0, glitched: 0, crits: 0, discoveries: 0, rebirths: 0, biggest: 0,
    rarest: null, playMs: 0,
  };
}

/** Higher is rarer. Cursed beats crystal, crystal beats any plain tier; shinies beat plain at the same tier. */
const variantRank = (variant: Variant) => (variant === "glitched" ? 3000 : variant === "cursed" ? 2000 : variant === "crystal" ? 1000 : 0);
const rarityScore = (x: { tier: number; variant: Variant }) =>
  variantRank(x.variant) + x.tier * 10 + (x.variant === "shiny" ? 5 : 0);

export function addLifetime(s: Save, result: RollResult, manual: boolean): Save {
  const l: Lifetime = { ...s.lifetime };
  l.rolls++;
  if (manual) l.manualRolls++;
  if (result.variant === "shiny") l.shinies++;
  if (result.variant === "crystal") l.crystals++;
  if (result.variant === "cursed") l.cursed++;
  if (result.variant === "glitched") l.glitched++;
  if (result.crit) l.crits++;
  if (result.isNew) l.discoveries++;
  if (result.value > l.biggest) l.biggest = result.value;
  if (!l.rarest || rarityScore(result) > rarityScore(l.rarest)) l.rarest = { tier: result.tier, tierId: TIERS[result.tier].id, variant: result.variant };
  return { ...s, lifetime: l };
}

/* ---------------- upgrade curves ---------------- */


export const newSave = (): Save => ({
  version: SAVE_VERSION,
  clovers: 0,
  totalEarned: 0,
  rolls: 0,
  luckyProgress: 0,
  upgrades: { luck: 0, auto: 0, shiny: 0, value: 0, crit: 0, luckyPace: 0, luckyPower: 0, crystal: 0, cursed: 0, glitched: 0 },
  materials: {},
  charms: newCharmState(),
  potions: newPotionState(),
  found: {},
  best: 0,
  rebirths: 0,
  cloverGems: 0,
  totalGems: 0,
  forever: newForeverLevels(),
  firstFound: {},
  event: null,
  nextEventAt: Date.now() + EVENT_GAP_MIN,
  quests: null,
  tickets: 0,
  totalTickets: 0,
  luckDoubler: 0,
  sound: true,
  auto: false,
  performance: false,
  luckScale: 1,
  lastActiveAt: Date.now(),
  offlineReward: null,
  totalOfflineEarned: 0,
  lifetime: newLifetime(),
});

export const MIN_LUCK_SCALE = 0.001;
/** Logarithmic mapping makes 1/1000 to full luck easy to adjust. */
export const luckScaleFromSlider = (position: number) => {
  const percent = Math.max(0, Math.min(100, Math.round(position)));
  return Math.round(10 ** (-3 + 3 * percent / 100) * 1e6) / 1e6;
};
export const sliderFromLuckScale = (scale: number) => Math.max(0, Math.min(100, Math.round(100 * (Math.log10(Math.max(MIN_LUCK_SCALE, scale)) + 3) / 3)));

/* ---------------- derived stats ---------------- */

export const crystalUnlocked = (s: Save) => s.rebirths >= CRYSTAL_REBIRTHS;
export const cursedUnlocked = (s: Save) => s.rebirths >= CURSED_REBIRTHS;
export const glitchedUnlocked = (s: Save) => s.rebirths >= GLITCHED_REBIRTHS;
export const autoUnlocked = (s: Save) => s.lifetime.manualRolls >= AUTO_UNLOCK_ROLLS;
export const upgradeUnlocked = (s: Save, id: UpgradeId) => {
  const upgrade = UPGRADES.find((item) => item.id === id);
  return !!upgrade && s.rebirths >= (upgrade.unlockAt ?? 0) && (id !== "auto" || autoUnlocked(s));
};

export function purchaseUpgrade(s: Save, id: UpgradeId, max = false): Save | null {
  const upgrade = UPGRADES.find((item) => item.id === id);
  if (!upgrade || !upgradeUnlocked(s, id)) return null;
  let level = s.upgrades[id];
  let clovers = s.clovers;
  while (level < upgrade.max && clovers >= upgrade.cost(level)) {
    clovers -= upgrade.cost(level++);
    if (!max) break;
  }
  return level === s.upgrades[id] ? null : { ...s, clovers, upgrades: { ...s.upgrades, [id]: level } };
}

/** Spends quest tickets on a repeatable clover pack. */
/** Spends tickets to double luck permanently, up to x4096. */
export const purchaseLuckDoubler = (s: Save): Save | null => buyLuckDoubler(s);

export function purchaseCloverPack(s: Save, id: CloverPackId): Save | null {
  const pack = CLOVER_PACKS.find((item) => item.id === id);
  if (!pack || Math.floor(s.tickets) < pack.tickets) return null;
  return {
    ...s,
    tickets: s.tickets - pack.tickets,
    clovers: Math.min(Number.MAX_SAFE_INTEGER, s.clovers + pack.amount),
    totalEarned: Math.min(Number.MAX_SAFE_INTEGER, s.totalEarned + pack.amount),
  };
}

/** Spends clover gems on a forever upgrade. These outlive every rebirth. */
export function purchaseForever(s: Save, id: ForeverId, max = false): Save | null {
  const def = FOREVER.find((item) => item.id === id);
  if (!def) return null;
  const current = foreverLevel(s.forever, id);
  let level = current;
  let gems = Math.floor(s.cloverGems);
  while (level < def.max && gems >= def.cost(level)) {
    gems -= def.cost(level++);
    if (!max) break;
  }
  return level === current ? null : { ...s, cloverGems: gems, forever: { ...s.forever, [id]: level } };
}
/** Whether a variant can drop yet (normal and shiny always can). */
export const variantUnlocked = (s: Save, variant: Variant) => variant === "glitched" ? glitchedUnlocked(s) : variant === "cursed" ? cursedUnlocked(s) : variant === "crystal" ? crystalUnlocked(s) : true;
export const discoveredCount = (s: Save) => Object.values(s.found).filter((n) => n > 0).length;
export const indexBonus = (s: Save) => 0.1 * discoveredCount(s);
export const baseLuck = (s: Save, now = Date.now()) => luckMultiplier(s.upgrades.luck) * (1 + indexBonus(s)) * rebirthLuck(s.rebirths) * foreverLuck(s.forever) * luckDoublerMultiplier(s.luckDoubler) * eventLuck(s, now) * charmBonuses(s).luck * potionBonuses(s, now).luck;
export const getLuck = (s: Save, now = Date.now()) => baseLuck(s, now) * s.luckScale;
export const luckyInterval = (s: Save) => BASE_LUCKY_ROLLS - s.upgrades.luckyPace * LUCKY_PACE_STEP;
export const luckyMultiplier = (s: Save) => 2 + s.upgrades.luckyPower * LUCKY_POWER_STEP;
export const rollsUntilLucky = (s: Save) => Math.max(1, luckyInterval(s) - s.luckyProgress);

export function rarityProbability(rarity: RarityId, luck: number) {
  return tierProbabilities(luck).reduce((total, chance, index) => total + (TIERS[index].rarity === rarity ? chance : 0), 0);
}

/** Maximize the combined odds of every clover in a rarity, not one named clover. */
export function recommendLuckForRarity(s: Save, rarity: RarityId, now = Date.now()) {
  const full = baseLuck(s, now);
  let best = { scale: 1, luck: full, chance: -1, position: 100 };
  for (let position = 0; position <= 100; position++) {
    const scale = luckScaleFromSlider(position);
    const luck = full * scale;
    const chance = rarityProbability(rarity, luck);
    // Where odds tie, favor more luck for other rare clovers.
    if (chance >= best.chance) best = { scale, luck, chance, position };
  }
  return best;
}
export const getShinyChance = (s: Save, now = Date.now(), rollBoost = 1) => Math.min(0.5, BASE_SHINY * (1 + 0.3 * s.upgrades.shiny) * variantLuck(s, now, rollBoost) * foreverShine(s.forever) * eventShiny(s, now) * charmBonuses(s).shiny * potionBonuses(s, now).shiny);

/**
 * Every variant scales with luck, so the luck stat and the luck dial always
 * matter. 1x at luck 1, ~2.8x at 5,800 luck, ~0.44x at the 1/1000 dial stop.
 * The floor lets low luck hunt commons; the cap stops huge luck flooding feed.
 */
export const VARIANT_LUCK_EXPONENT = 0.12;
export const VARIANT_LUCK_CAP = 8;
export const VARIANT_LUCK_MIN = 0.25;
export const variantLuck = (s: Save, now = Date.now(), rollBoost = 1) => Math.min(VARIANT_LUCK_CAP, Math.max(VARIANT_LUCK_MIN, (Math.max(0, getLuck(s, now)) * rollBoost) ** VARIANT_LUCK_EXPONENT));
export const getCrystalChance = (s: Save, now = Date.now(), rollBoost = 1) => crystalUnlocked(s)
  ? Math.min(MAX_CRYSTAL_CHANCE, BASE_CRYSTAL * (1 + 1.96 * s.upgrades.crystal) * variantLuck(s, now, rollBoost) * foreverShine(s.forever) * charmBonuses(s).crystal * potionBonuses(s, now).crystal) : 0;
export const getCursedChance = (s: Save, now = Date.now(), rollBoost = 1) => cursedUnlocked(s)
  ? Math.min(MAX_CURSED_CHANCE, BASE_CURSED * (1 + 5.96 * s.upgrades.cursed) * variantLuck(s, now, rollBoost) * foreverShine(s.forever) * charmBonuses(s).cursed * potionBonuses(s, now).cursed) : 0;
export const getGlitchedChance = (s: Save, now = Date.now(), rollBoost = 1) => glitchedUnlocked(s)
  ? Math.min(MAX_GLITCHED_CHANCE, BASE_GLITCHED * (1 + 19.96 * s.upgrades.glitched) * variantLuck(s, now, rollBoost) * foreverShine(s.forever) * charmBonuses(s).glitched * potionBonuses(s, now).glitched) : 0;
export const valueMult = (s: Save, now = Date.now()) => (1 + 0.4 * s.upgrades.value) * rebirthValue(s.rebirths) * foreverValue(s.forever) * eventValue(s, now) * charmBonuses(s).value * potionBonuses(s, now).value;
export const critChance = (s: Save, now = Date.now()) => Math.min(0.95, s.upgrades.crit * 0.03 + foreverFortune(s.forever) + charmBonuses(s).crit + potionBonuses(s, now).crit);
export const critMultiplier = (s: Save, now = Date.now()) => 10 * charmBonuses(s).critPower * potionBonuses(s, now).critPower;
/** Time from one spin start to the next: the 3.2s spin plus a pause the Auto Speed upgrade shortens. */
export const autoInterval = (s: Save, now = Date.now()) => ROLL_DURATION + Math.max(1, Math.round((s.upgrades.auto > 0 ? autoDelay(s.upgrades.auto) : FREE_AUTO_DELAY) * foreverSpeed(s.forever) * charmBonuses(s).autoPause * potionBonuses(s, now).autoPause));
export const manualRollsPerSecond = (_s: Save) => 1000 / ROLL_DURATION;
export const autoRollsPerSecond = (s: Save, now = Date.now()) => {
  const interval = autoInterval(s, now);
  return autoUnlocked(s) ? 1000 / interval : 0;
};
/** Rolls per second for someone clicking nonstop with Auto Roll running beside them. */
export const activeRollsPerSecond = (s: Save) => autoRollsPerSecond(s) + manualRollsPerSecond(s);
/** Passive (auto-only) rolls per second, used for offline simulation. */
export const passiveRollsPerSecond = (s: Save, now = Date.now()) => (s.auto && autoUnlocked(s) ? autoRollsPerSecond(s, now) : 0);
export const canRebirth = (s: Save) => s.rebirths < REBIRTH_MAX && s.clovers >= rebirthCost(s.rebirths);

export const variantValue = (variant: Variant) => variant === "glitched" ? GLITCHED_VALUE : variant === "cursed" ? CURSED_VALUE : variant === "crystal" ? CRYSTAL_VALUE : variant === "shiny" ? SHINY_VALUE : 1;
/** Nominal base odds for one variant on any single tier: 1 in 50 shiny, 500 crystal, 2000 cursed, 10000 glitched. */
export const variantBaseOdds = (variant: Variant) => variant === "glitched" ? 1 / BASE_GLITCHED : variant === "cursed" ? 1 / BASE_CURSED : variant === "crystal" ? 1 / BASE_CRYSTAL : variant === "shiny" ? 1 / BASE_SHINY : 1;
/** Keep variant odds normalized even when a lucky spin and buffs overlap. */
export function getVariantChances(s: Save, now = Date.now(), rollBoost = 1) {
  const shiny = getShinyChance(s, now, rollBoost);
  const crystal = getCrystalChance(s, now, rollBoost);
  const cursed = getCursedChance(s, now, rollBoost);
  const glitched = getGlitchedChance(s, now, rollBoost);
  const total = shiny + crystal + cursed + glitched;
  const scale = total > 0.99 ? 0.99 / total : 1;
  return { shiny: shiny * scale, crystal: crystal * scale, cursed: cursed * scale, glitched: glitched * scale };
}
/** Single source of truth for turning variant chances into a variant. Rarest is checked first. */
export function sampleVariant(chances: { shiny: number; crystal: number; cursed: number; glitched: number }, roll = Math.random()): Variant {
  if (roll < chances.glitched) return "glitched";
  if (roll < chances.glitched + chances.cursed) return "cursed";
  if (roll < chances.glitched + chances.cursed + chances.crystal) return "crystal";
  if (roll < chances.glitched + chances.cursed + chances.crystal + chances.shiny) return "shiny";
  return "normal";
}
export const variantChance = (s: Save, variant: Variant, now = Date.now()) => {
  const chances = getVariantChances(s, now);
  return variant === "normal" ? Math.max(0, 1 - chances.shiny - chances.crystal - chances.cursed - chances.glitched) : chances[variant];
};

export const foundKey = (tier: number, variant: Variant) => `${TIERS[tier].id}${variant === "normal" ? "" : `:${variant}`}`;

/** Exact expected payout of one roll at a given lucky boost, including rounding, crits and variants. */
export function expectedPayoutForBoost(s: Save, now: number, rollBoost: number): number {
  const probabilities = tierProbabilities(getLuck(s, now) * rollBoost);
  const { shiny, crystal, cursed, glitched } = getVariantChances(s, now, rollBoost);
  const crit = critChance(s, now);
  const multiplier = valueMult(s, now);
  const variants = [
    { chance: Math.max(0, 1 - shiny - crystal - cursed - glitched), value: 1 },
    { chance: shiny, value: SHINY_VALUE },
    { chance: crystal, value: CRYSTAL_VALUE },
    { chance: cursed, value: CURSED_VALUE },
    { chance: glitched, value: GLITCHED_VALUE },
  ];
  let payout = 0;
  for (let tier = 0; tier < TIERS.length; tier++) {
    for (const variant of variants) {
      const ordinary = Math.round(TIERS[tier].value * variant.value * multiplier);
      const critical = Math.round(TIERS[tier].value * variant.value * multiplier * critMultiplier(s, now));
      payout += probabilities[tier] * variant.chance * ((1 - crit) * ordinary + crit * critical);
    }
  }
  return Number.isFinite(payout) ? payout : 0;
}
/** Average payout across the lucky cycle: ordinary spins plus the boosted lucky spin. Used for offline pay. */
export function expectedPayout(s: Save, now = Date.now()): number {
  const interval = luckyInterval(s);
  const ordinary = expectedPayoutForBoost(s, now, 1);
  const lucky = expectedPayoutForBoost(s, now, luckyMultiplier(s));
  return ((interval - 1) * ordinary + lucky) / interval;
}

/** Everything a rebirth wipes, and everything it keeps. */
export function doRebirth(s: Save): Save {
  if (!canRebirth(s)) return s;
  const fresh = newSave();
  const gems = gemsForRebirth(s);
  return {
    ...fresh,
    rebirths: s.rebirths + 1,
    totalEarned: s.totalEarned,
    // the leftover clovers come back as gems; gems and forever upgrades are kept
    cloverGems: s.cloverGems + gems,
    totalGems: s.totalGems + gems,
    forever: s.forever,
    firstFound: s.firstFound,
    event: s.event,
    nextEventAt: s.nextEventAt,
    quests: s.quests,
    tickets: s.tickets,
    totalTickets: s.totalTickets,
    luckDoubler: s.luckDoubler,
    found: s.found,
    materials: s.materials,
    charms: s.charms,
    potions: s.potions,
    luckyProgress: s.luckyProgress,
    best: s.best,
    sound: s.sound,
    auto: s.auto,
    performance: s.performance,
    totalOfflineEarned: s.totalOfflineEarned,
    offlineReward: s.offlineReward,
    lastActiveAt: Math.max(s.lastActiveAt, fresh.lastActiveAt),
    // all-time stats survive a rebirth; the rebirth itself is counted
    lifetime: { ...s.lifetime, rebirths: s.lifetime.rebirths + 1 },
  };
}

/* ---------------- rolling ---------------- */

export type RollResult = {
  id: number;
  tier: number;
  variant: Variant;
  lucky: boolean;
  luckyMultiplier: number;
  crit: boolean;
  critMultiplier: number;
  value: number;
  isNew: boolean;
  material: MaterialId;
  materialAmount: number;
  /** Exact combined odds of this tier + variant at roll time, after every buff. */
  odds: number;
};

export function tierProbabilities(luck: number): number[] {
  const probabilities = new Array<number>(TIERS.length).fill(0);
  let remaining = 1;
  for (let i = TIERS.length - 1; i >= 1; i--) {
    const chance = Math.min(0.4, Math.max(0, luck) / TIERS[i].chance);
    probabilities[i] = remaining * chance;
    remaining -= probabilities[i];
  }
  probabilities[0] = remaining;
  return probabilities;
}

export function drawTier(probabilities: number[]): number {
  let random = Math.random();
  for (let i = probabilities.length - 1; i >= 1; i--) {
    random -= probabilities[i];
    if (random < 0) return i;
  }
  return 0;
}

export const effectiveOdds = (tier: number, luck: number) => 1 / Math.max(1e-12, tierProbabilities(luck)[tier]);

export function rollOnce(s: Save, nextId: () => number, now = Date.now()) {
  const found = { ...s.found };
  const materials = { ...s.materials };
  const lucky = s.luckyProgress + 1 >= luckyInterval(s);
  const luckyBoost = lucky ? luckyMultiplier(s) : 1;
  const probabilities = tierProbabilities(getLuck(s, now) * luckyBoost);
  const chances = getVariantChances(s, now, luckyBoost);
  const crits = critChance(s, now);
  const multiplier = valueMult(s, now);
  const tier = drawTier(probabilities);
  const variant = sampleVariant(chances);
  const crit = Math.random() < crits;
  const key = foundKey(tier, variant);
  const isNew = !(found[key] > 0);
  found[key] = (found[key] ?? 0) + 1;
  const firstFound = isNew ? { ...s.firstFound, [key]: now } : s.firstFound;
  const material = materialFromClover(TIERS[tier], variant);
  const materialAmount = 1 + charmBonuses(s).bagYield + potionBonuses(s, now).bagYield;
  materials[material] = Math.min(Number.MAX_SAFE_INTEGER, (materials[material] ?? 0) + materialAmount);
  const criticalMultiplier = crit ? critMultiplier(s, now) : 1;
  const value = Math.round(TIERS[tier].value * variantValue(variant) * criticalMultiplier * multiplier);
  const tierChance = Math.max(1e-12, probabilities[tier]);
  const variantChance = variant === "normal"
    ? Math.max(1e-12, 1 - chances.shiny - chances.crystal - chances.cursed - chances.glitched)
    : Math.max(1e-12, chances[variant]);
  const result: RollResult = { id: nextId(), tier, variant, lucky, luckyMultiplier: luckyBoost, crit, critMultiplier: criticalMultiplier, value, isNew, material, materialAmount, odds: 1 / (tierChance * variantChance) };

  return {
    next: { ...s, clovers: s.clovers + value, totalEarned: s.totalEarned + value, rolls: s.rolls + 1, luckyProgress: lucky ? 0 : s.luckyProgress + 1, found, firstFound, materials, best: Math.max(s.best, tier) },
    result,
  };
}

export const STORAGE_KEY = "clover-rng-save-v3";
const LEGACY_KEYS = ["clover-rng-save-v2", "clover-rng-save-v1"];
const nonnegative = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;

// Old saves stored the rarest tier as an array index. Inserting low-odds
// clovers changes those indices, so migrate through the original stable IDs.
export const LEGACY_TIER_IDS = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "divine", "cosmic", "eclipse", "aurora", "singularity", "prismatic", "solar", "moonlit", "tidal", "inferno", "glacier", "sakura", "thunder", "verdant", "obsidian", "celestial", "chrono", "infinite"];
/** Version 5 included the first nine additions. Preserve its stored rarest-find index too. */
export const VERSION_5_TIER_IDS = ["common", "uncommon", "dewdrop", "rare", "copper", "epic", "honey", "legendary", "lotus", "mythic", "divine", "amethyst", "cosmic", "eclipse", "venom", "aurora", "singularity", "prismatic", "solar", "moonlit", "tempest", "tidal", "inferno", "glacier", "sakura", "thunder", "verdant", "obsidian", "celestial", "chrono", "bloodmoon", "infinite", "empyrean"];
/** The v6 order, before this batch of ten rarity tiers was added. */
export const VERSION_6_TIER_IDS = ["common", "starfall", "uncommon", "dewdrop", "moss", "rare", "copper", "epic", "marigold", "honey", "legendary", "coral", "lotus", "mythic", "sapphire", "divine", "amethyst", "cosmic", "eclipse", "venom", "aurora", "phantom", "singularity", "prismatic", "solar", "rift", "moonlit", "tempest", "tidal", "inferno", "glacier", "stormglass", "sakura", "thunder", "verdant", "obsidian", "crownfire", "celestial", "chrono", "bloodmoon", "eventide", "infinite", "empyrean"];

/** Local save migration drops removed features, never clovers or discoveries. */
export function sanitizeSave(raw: unknown): Save {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<Save>;
  const base = newSave();
  const upgrades = { ...base.upgrades };
  for (const definition of UPGRADES) {
    upgrades[definition.id] = Math.min(definition.max, Math.floor(nonnegative(parsed.upgrades?.[definition.id])));
  }
  const found: Record<string, number> = {};
  const migratingMaterials = (parsed.version ?? 0) < 14;
  const materials: MaterialBag = migratingMaterials ? {} : sanitizeMaterials(parsed.materials);
  const legacyInventory = (parsed as Partial<Save> & { inventory?: Record<string, number> }).inventory;
  for (let tier = 0; tier < TIERS.length; tier++) {
    for (const variant of VARIANTS) {
      const key = foundKey(tier, variant);
      const legacyKey = TIERS[tier].id === "prismatic" && (variant === "normal" || variant === "shiny") ? `secret${variant === "shiny" ? ":shiny" : ""}` : key;
      const count = Math.floor(nonnegative(parsed.found?.[key] ?? parsed.found?.[legacyKey]));
      if (count > 0) found[key] = count;
      if (migratingMaterials) {
        // Convert only unspent copies. Very old saves predate spending altogether.
        const unspent = (parsed.version ?? 0) < 10 ? count : Math.floor(nonnegative(legacyInventory?.[key] ?? legacyInventory?.[legacyKey]));
        if (unspent > 0) {
          const material = materialFromClover(TIERS[tier], variant);
          materials[material] = Math.min(Number.MAX_SAFE_INTEGER, (materials[material] ?? 0) + unspent);
        }
      }
    }
  }
  const rebirths = Math.min(REBIRTH_MAX, Math.floor(nonnegative(parsed.rebirths)));
  const lifetime = sanitizeLifetime(parsed.lifetime, parsed.version ?? 0);
  const previousRolls = lifetime.rolls > 0 ? lifetime.rolls : Math.floor(nonnegative(parsed.rolls));
  const luckyProgress = (parsed.version ?? 0) >= 13
    ? Math.min(BASE_LUCKY_ROLLS - 1, Math.floor(nonnegative(parsed.luckyProgress)))
    : previousRolls % BASE_LUCKY_ROLLS;
  const save: Save = {
    ...base,
    version: SAVE_VERSION,
    clovers: nonnegative(parsed.clovers),
    totalEarned: nonnegative(parsed.totalEarned),
    rolls: Math.floor(nonnegative(parsed.rolls)),
    luckyProgress,
    upgrades,
    materials,
    charms: sanitizeCharmState(parsed.charms),
    potions: sanitizePotionState(parsed.potions, rebirths),
    found,
    best: Math.max(0, ...TIERS.map((_, i) => VARIANTS.some((v) => found[foundKey(i, v)]) ? i : 0)),
    rebirths,
    cloverGems: nonnegative(parsed.cloverGems),
    totalGems: nonnegative(parsed.totalGems),
    forever: sanitizeForever(parsed.forever),
    firstFound: sanitizeFirstFound(parsed.firstFound),
    event: sanitizeEvent(parsed.event),
    nextEventAt: nonnegative(parsed.nextEventAt, base.nextEventAt) || base.nextEventAt,
    quests: sanitizeQuests(parsed.quests),
    tickets: nonnegative(parsed.tickets),
    totalTickets: nonnegative(parsed.totalTickets),
    luckDoubler: Math.min(LUCK_DOUBLER_MAX_LEVEL, Math.floor(nonnegative(parsed.luckDoubler))),
    sound: parsed.sound !== false,
    auto: parsed.auto === true && lifetime.manualRolls >= AUTO_UNLOCK_ROLLS,
    performance: parsed.performance === true,
    luckScale: typeof parsed.luckScale === "number" && Number.isFinite(parsed.luckScale)
      ? Math.max(MIN_LUCK_SCALE, Math.min(1, parsed.luckScale)) : 1,
    lastActiveAt: nonnegative(parsed.lastActiveAt, base.lastActiveAt) || base.lastActiveAt,
    offlineReward: null,
    totalOfflineEarned: nonnegative(parsed.totalOfflineEarned),
    lifetime,
  };
  const reward = parsed.offlineReward;
  if (reward && typeof reward.id === "string" && reward.id.length <= 160 && nonnegative(reward.amount) >= 1) {
    save.offlineReward = {
      id: reward.id,
      amount: Math.min(Number.MAX_SAFE_INTEGER, Math.floor(nonnegative(reward.amount))),
      awayMs: Math.min(365 * 86400000, nonnegative(reward.awayMs)),
      creditedMs: Math.min(16 * 3600000, nonnegative(reward.creditedMs)),
      capped: reward.capped === true,
      createdAt: nonnegative(reward.createdAt, base.lastActiveAt),
    };
  }
  return save;
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!raw) return sanitizeSave(newSave());
    return sanitizeSave(JSON.parse(raw));
  } catch {
    return sanitizeSave(newSave());
  }
}

function sanitizeFirstFound(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(value);
    if (key.length <= 64 && Number.isFinite(n) && n > 0) out[key] = n;
  }
  return out;
}

function sanitizeEvent(raw: unknown): Save["event"] {
  const e = raw as Save["event"];
  if (!e || !EVENTS.some((d) => d.id === e.id)) return null;
  const startedAt = Number(e.startedAt), endsAt = Number(e.endsAt);
  if (!Number.isFinite(startedAt) || !Number.isFinite(endsAt) || endsAt - startedAt > EVENT_DURATION + 1000 || endsAt <= startedAt) return null;
  return { id: e.id, startedAt, endsAt };
}

/** Clamps stored forever levels to their caps, so a hand-edited save can't break the game. */
function sanitizeForever(raw: unknown): ForeverLevels {
  const levels = newForeverLevels();
  if (!raw || typeof raw !== "object") return levels;
  for (const def of FOREVER) {
    const value = (raw as Record<string, unknown>)[def.id];
    const level = Math.floor(Number(value));
    if (Number.isFinite(level) && level > 0) levels[def.id] = Math.min(def.max, level);
  }
  return levels;
}

/** Clamps stored lifetime stats so a damaged or hand-edited save can't break the UI. */
function sanitizeLifetime(raw: Partial<Lifetime> | undefined, version: number): Lifetime {
  const base = newLifetime();
  if (!raw || typeof raw !== "object") return base;
  const num = (value: unknown) => nonnegative(value);
  const rarest = raw.rarest;
  const oldIds = version >= 8 ? TIERS.map((tier) => tier.id) : version >= 6 ? VERSION_6_TIER_IDS : version >= 5 ? VERSION_5_TIER_IDS : LEGACY_TIER_IDS;
  const oldId = rarest && Number.isInteger(rarest.tier)
    ? oldIds[rarest.tier]
    : undefined;
  const tierId = rarest?.tierId && TIERS.some((t) => t.id === rarest.tierId) ? rarest.tierId : oldId;
  const tier = TIERS.findIndex((t) => t.id === tierId);
  const validRarest = rarest && tier >= 0 && VARIANTS.includes(rarest.variant) ? { tier, tierId, variant: rarest.variant } : null;
  return {
    rolls: num(raw.rolls),
    // Older saves did not distinguish manual from auto/multi rolls, so only new manual spins count.
    manualRolls: Math.floor(num(raw.manualRolls)),
    shinies: num(raw.shinies),
    crystals: num(raw.crystals),
    cursed: num(raw.cursed),
    glitched: num(raw.glitched),
    crits: num(raw.crits),
    discoveries: num(raw.discoveries),
    rebirths: num(raw.rebirths),
    biggest: num(raw.biggest),
    rarest: validRarest,
    playMs: num(raw.playMs),
  };
}

export function storeSave(s: Save): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    // The game remains playable if storage is unavailable.
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    // Ignore restricted storage.
  }
}

/* ---------------- formatting ---------------- */

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return "MAX";
  if (n < 1000) return Math.floor(n).toLocaleString("en-US");
  let i = 0;
  let v = n;
  while (v >= 1000 && i < SUFFIXES.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v >= 100 ? Math.floor(v) : v.toFixed(1).replace(/\.0$/, "")}${SUFFIXES[i]}`;
}

export function fmtOdds(n: number): string {
  return n < 1e6 ? Math.max(1, Math.round(n)).toLocaleString("en-US") : fmt(n);
}
