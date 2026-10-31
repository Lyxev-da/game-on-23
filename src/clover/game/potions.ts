import type { Save } from "./data";
import type { IconName } from "./icons";
import { hasMaterials, spendMaterials, type Ingredient } from "./materials";

/** The brewery is permanent once the player has rebirthed, including on a later reset of upgrades. */
export const BREWERY_REBIRTHS = 1;
export const POTION_DURATION_MS = 5 * 60 * 1000;
export const MAX_POTION_STOCK = 99;

export type PotionBuffs = {
  luck: number;
  value: number;
  shiny: number;
  crystal: number;
  cursed: number;
  glitched: number;
  crit: number;
  critPower: number;
  autoPause: number;
  bagYield: number;
};

export type PotionRecipe = {
  id: string;
  name: string;
  icon: IconName;
  hue: number;
  power: string;
  description: string;
  duration: number;
  unlockAt: number;
  ingredients: readonly Ingredient[];
  buffs: Partial<PotionBuffs>;
};

// Every name is short, every bottle lasts five minutes, and every buff is a
// strong-but-fair nudge — about one good permanent charm, not a game-breaker.
export const POTIONS = ([
  {
    id: "luck", name: "LUCK POTION", icon: "potionLuck", hue: 132,
    power: "2X LUCK", description: "Better odds for five minutes.", unlockAt: 1,
    ingredients: [{ key: "common", count: 15 }, { key: "uncommon", count: 4 }],
    buffs: { luck: 2 },
  },
  {
    id: "gold", name: "GOLD POTION", icon: "potionGold", hue: 45,
    power: "2X PAY", description: "Every roll pays twice as much.", unlockAt: 1,
    ingredients: [{ key: "uncommon", count: 8 }, { key: "rare", count: 2 }],
    buffs: { value: 2 },
  },
  {
    id: "shiny", name: "SHINY POTION", icon: "potionShiny", hue: 199,
    power: "3X SHINY", description: "Shiny clovers show up three times more.", unlockAt: 1,
    ingredients: [{ key: "rare", count: 3 }, { key: "shiny", count: 1 }],
    buffs: { shiny: 3 },
  },
  {
    id: "crit", name: "CRIT POTION", icon: "potionCrit", hue: 19,
    power: "+25% CRIT / 2X CRIT PAY", description: "More crits, and crits pay twice as much.", unlockAt: 1,
    ingredients: [{ key: "epic", count: 3 }, { key: "legendary", count: 1 }],
    buffs: { crit: 0.25, critPower: 2 },
  },
  {
    id: "fast", name: "FAST POTION", icon: "potionFast", hue: 162,
    power: "50% LESS AUTO WAIT", description: "Auto rolls faster. The spin is unchanged.", unlockAt: 1,
    ingredients: [{ key: "epic", count: 3 }, { key: "legendary", count: 1 }],
    buffs: { autoPause: 0.5 },
  },
  {
    id: "bag", name: "BAG POTION", icon: "potionBag", hue: 272,
    power: "+2 MATERIALS PER ROLL", description: "Each roll gives two extra materials.", unlockAt: 1,
    ingredients: [{ key: "uncommon", count: 12 }, { key: "rare", count: 2 }],
    buffs: { bagYield: 2 },
  },
  {
    id: "god", name: "GOD POTION", icon: "potionGod", hue: 330,
    power: "EVERY BUFF AT ONCE", description: "3x luck, 3x pay, 3x shiny, 3x crystal, +25% crit, 2x crit pay, faster auto, 2 extra materials per roll.", unlockAt: 1,
    ingredients: [{ key: "mythic", count: 2 }, { key: "divine", count: 1 }, { key: "cosmic", count: 1 }, { key: "shiny", count: 2 }],
    buffs: { luck: 3, value: 3, shiny: 3, crystal: 3, crit: 0.25, critPower: 2, autoPause: 0.5, bagYield: 2 },
  },
  {
    id: "curse", name: "CURSE POTION", icon: "potionCursed", hue: 345,
    power: "3X CURSED", description: "Cursed clovers appear more often.", unlockAt: 10,
    ingredients: [{ key: "epic", count: 6 }, { key: "cosmic", count: 1 }],
    buffs: { cursed: 3 },
  },
  {
    id: "glitch", name: "GLITCH POTION", icon: "potionGlitched", hue: 185,
    power: "4X GLITCHED", description: "Glitched clovers appear more often.", unlockAt: 15,
    ingredients: [{ key: "legendary", count: 3 }, { key: "cosmic", count: 2 }],
    buffs: { glitched: 4 },
  },
] as const satisfies readonly Omit<PotionRecipe, "duration">[]).map((recipe) => ({ ...recipe, duration: POTION_DURATION_MS }));

export type PotionId = (typeof POTIONS)[number]["id"];
export type ActivePotion = { id: PotionId; startedAt: number; expiresAt: number };
export type PotionState = { bottles: Partial<Record<PotionId, number>>; active: ActivePotion | null; brewed: number };

export const NO_POTION_BUFFS: PotionBuffs = {
  luck: 1, value: 1, shiny: 1, crystal: 1, cursed: 1, glitched: 1, crit: 0, critPower: 1, autoPause: 1, bagYield: 0,
};

export const newPotionState = (): PotionState => ({ bottles: {}, active: null, brewed: 0 });
export const breweryUnlocked = (save: Save) => save.rebirths >= BREWERY_REBIRTHS;
export const potionFor = (id: PotionId) => POTIONS.find((potion) => potion.id === id);

/** A potion never makes a permanent stat a different type, and time is always wall-clock time. */
export function activePotion(save: Save, now = Date.now()): ActivePotion | null {
  const active = save.potions?.active;
  const recipe = active && potionFor(active.id);
  return active && recipe && save.rebirths >= recipe.unlockAt && active.startedAt <= now && active.expiresAt > now ? active : null;
}

export function potionBonuses(save: Save, now = Date.now()): PotionBuffs {
  const active = activePotion(save, now);
  if (!active) return NO_POTION_BUFFS;
  const recipe = potionFor(active.id);
  if (!recipe) return NO_POTION_BUFFS;
  const buffs: Partial<PotionBuffs> = recipe.buffs;
  return {
    luck: buffs.luck ?? 1,
    value: buffs.value ?? 1,
    shiny: buffs.shiny ?? 1,
    crystal: buffs.crystal ?? 1,
    cursed: buffs.cursed ?? 1,
    glitched: buffs.glitched ?? 1,
    crit: buffs.crit ?? 0,
    critPower: buffs.critPower ?? 1,
    autoPause: buffs.autoPause ?? 1,
    bagYield: buffs.bagYield ?? 0,
  };
}

export const potionRemaining = (save: Save, now = Date.now()) => Math.max(0, (activePotion(save, now)?.expiresAt ?? now) - now);

export function potionTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function sanitizePotionState(raw: unknown, rebirths = 0): PotionState {
  const value = raw && typeof raw === "object" ? raw as Partial<PotionState> : {};
  const bottles: PotionState["bottles"] = {};
  if (value.bottles && typeof value.bottles === "object") {
    for (const recipe of POTIONS) {
      const count = value.bottles[recipe.id];
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        bottles[recipe.id] = Math.min(MAX_POTION_STOCK, Math.floor(count));
      }
    }
  }
  // Preserve timestamps even when a potion has just expired: offline settlement must
  // use the portion of the saved absence during which that potion was still active.
  let active: ActivePotion | null = null;
  const stored = value.active;
  if (stored && rebirths >= BREWERY_REBIRTHS) {
    const recipe = POTIONS.find((potion) => potion.id === stored.id);
    if (recipe && rebirths >= recipe.unlockAt && Number.isFinite(stored.startedAt) && Number.isFinite(stored.expiresAt) && stored.startedAt > 0
      && stored.expiresAt === stored.startedAt + recipe.duration) {
      active = { id: recipe.id, startedAt: stored.startedAt, expiresAt: stored.expiresAt };
    }
  }
  const brewed = typeof value.brewed === "number" && Number.isFinite(value.brewed) ? Math.max(0, Math.floor(value.brewed)) : 0;
  return { bottles, active, brewed };
}

/** Brewing spends only materials, never Index discoveries or clover currency. */
export function canBrewPotion(save: Save, id: PotionId): boolean {
  const recipe = potionFor(id);
  return !!recipe && save.rebirths >= recipe.unlockAt && (save.potions.bottles[id] ?? 0) < MAX_POTION_STOCK &&
    hasMaterials(save, recipe.ingredients);
}

export function brewPotion(save: Save, id: PotionId): Save | null {
  const recipe = potionFor(id);
  if (!recipe || !canBrewPotion(save, id)) return null;
  const materials = spendMaterials(save, recipe.ingredients);
  if (!materials) return null;
  return {
    ...save,
    materials,
    potions: { ...save.potions, bottles: { ...save.potions.bottles, [id]: (save.potions.bottles[id] ?? 0) + 1 }, brewed: save.potions.brewed + 1 },
  };
}

export function drinkPotion(save: Save, id: PotionId, now = Date.now()): Save | null {
  const recipe = potionFor(id);
  if (!recipe || save.rebirths < recipe.unlockAt || activePotion(save, now) || !Number.isFinite(now) || now <= 0) return null;
  if (!save.potions.bottles[id] || save.potions.bottles[id]! < 1) return null;
  const bottles = { ...save.potions.bottles };
  if (bottles[id] === 1) delete bottles[id];
  else bottles[id] = bottles[id]! - 1;
  return {
    ...save,
    potions: { ...save.potions, bottles, active: { id, startedAt: now, expiresAt: now + recipe.duration } },
  };
}

/** Ended potions stop doing work without touching a stored bottle or a recipe's lock. */
export function expirePotion(save: Save, now = Date.now()): Save {
  if (!save.potions.active || !Number.isFinite(now) || now <= 0 || save.potions.active.expiresAt > now) return save;
  return { ...save, potions: { ...save.potions, active: null } };
}


