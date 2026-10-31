import type { Save } from "./data";
import type { IconName } from "./icons";
import { hasMaterials, spendMaterials, type Ingredient } from "./materials";

/** Slots you always have. The Twin Ring raises this while it is equipped. */
export const BASE_CHARM_SLOTS = 3;
/** Hard ceiling so a damaged save can never equip more than the Twin Ring allows. */
const MAX_CHARM_SLOTS = 5;

type CharmEffect =
  | { kind: "luck" | "value" | "shiny" | "crystal" | "cursed" | "glitched" | "autoPause" | "critPower"; multiplier: number }
  | { kind: "crit" | "craftSave"; bonus: number }
  | { kind: "bagYield" | "slots"; amount: number };

type CharmRecipe = {
  id: string;
  name: string;
  icon: IconName;
  hue: number;
  power: string;
  description: string;
  ingredients: readonly Ingredient[];
  effect: CharmEffect;
  unlockAt?: number;
};

// Recipes pool materials from every clover of a rarity; no exact clover is required.
export const CHARMS = [
  {
    id: "gem", name: "LUCKY GEM", icon: "charmGem", hue: 132,
    power: "+35% LUCK", description: "More luck.",
    ingredients: [{ key: "common", count: 12 }, { key: "uncommon", count: 3 }],
    effect: { kind: "luck", multiplier: 1.35 },
  },
  {
    id: "coin", name: "GOLD COIN", icon: "charmCoin", hue: 42,
    power: "+50% VALUE", description: "Clovers pay more.",
    ingredients: [{ key: "uncommon", count: 8 }, { key: "rare", count: 2 }],
    effect: { kind: "value", multiplier: 1.5 },
  },
  {
    id: "star", name: "SHINY STAR", icon: "charmStar", hue: 48,
    power: "2X SHINY", description: "More shiny clovers.",
    ingredients: [{ key: "rare", count: 3 }, { key: "shiny", count: 1 }],
    effect: { kind: "shiny", multiplier: 2 },
  },
  {
    id: "bolt", name: "HOT BOLT", icon: "charmBolt", hue: 19,
    power: "+8% CRIT", description: "More crit rolls.",
    ingredients: [{ key: "epic", count: 4 }, { key: "legendary", count: 1 }],
    effect: { kind: "crit", bonus: 0.08 },
  },
  {
    id: "gear", name: "FAST GEAR", icon: "charmGear", hue: 205,
    power: "45% LESS AUTO WAIT", description: "Auto rolls faster.",
    ingredients: [{ key: "legendary", count: 2 }, { key: "epic", count: 4 }],
    effect: { kind: "autoPause", multiplier: 0.55 },
  },
  {
    id: "drop", name: "ICE DROP", icon: "charmDrop", hue: 203,
    power: "2.5X CRYSTAL", description: "More crystal clovers.",
    ingredients: [{ key: "mythic", count: 1 }, { key: "divine", count: 1 }],
    effect: { kind: "crystal", multiplier: 2.5 },
  },
  {
    id: "ring", name: "GREEN RING", icon: "charmRing", hue: 118,
    power: "+75% LUCK", description: "Lots more luck.",
    ingredients: [{ key: "uncommon", count: 10 }, { key: "rare", count: 5 }, { key: "epic", count: 2 }],
    effect: { kind: "luck", multiplier: 1.75 },
  },
  {
    id: "pouch", name: "BIG POUCH", icon: "charmPouch", hue: 142,
    power: "+1 MATERIAL PER ROLL", description: "Rolls give an extra crafting material.",
    ingredients: [{ key: "shiny", count: 1 }, { key: "epic", count: 3 }],
    effect: { kind: "bagYield", amount: 1 },
  },
  {
    id: "spool", name: "PINK SPOOL", icon: "charmSpool", hue: 319,
    power: "35% FREE CRAFTS", description: "Crafting often costs nothing.",
    ingredients: [{ key: "legendary", count: 3 }, { key: "mythic", count: 1 }],
    effect: { kind: "craftSave", bonus: 0.35 },
  },
  {
    id: "comet", name: "COMET", icon: "charmComet", hue: 38,
    power: "+15% CRIT", description: "Many more crit rolls.",
    ingredients: [{ key: "mythic", count: 2 }, { key: "cosmic", count: 1 }],
    effect: { kind: "crit", bonus: 0.15 },
  },
  {
    id: "rainbow", name: "RAINBOW", icon: "charmRainbow", hue: 286,
    power: "4X SHINY", description: "Tons more shiny clovers.",
    ingredients: [{ key: "cosmic", count: 5 }, { key: "shiny", count: 3 }],
    effect: { kind: "shiny", multiplier: 4 },
  },
  {
    id: "moon", name: "MOON", icon: "charmMoon", hue: 222,
    power: "4X CRYSTAL", description: "Tons more crystal clovers.",
    ingredients: [{ key: "cosmic", count: 2 }, { key: "crystal", count: 1 }],
    effect: { kind: "crystal", multiplier: 4 },
  },
  {
    id: "crown", name: "CROWN", icon: "charmCrown", hue: 45,
    power: "+150% LUCK", description: "Huge luck boost.",
    ingredients: [{ key: "divine", count: 2 }, { key: "cosmic", count: 3 }],
    effect: { kind: "luck", multiplier: 2.5 },
  },
  {
    id: "trio", name: "TRIPLE GEM", icon: "charmTrio", hue: 162,
    power: "+3 MATERIALS PER ROLL", description: "Rolls give three extra crafting materials.",
    ingredients: [{ key: "cosmic", count: 6 }, { key: "shiny", count: 4 }],
    effect: { kind: "bagYield", amount: 3 },
  },
  {
    id: "clock", name: "GOLD CLOCK", icon: "charmClock", hue: 199,
    power: "65% LESS AUTO WAIT", description: "Auto rolls much faster.",
    ingredients: [{ key: "secret", count: 1 }, { key: "cosmic", count: 4 }],
    effect: { kind: "autoPause", multiplier: 0.35 },
  },
  {
    id: "twin", name: "TWIN RING", icon: "charmTwin", hue: 272,
    power: "+2 CHARM SLOTS", description: "Two more slots, so you gain one.",
    ingredients: [{ key: "secret", count: 2 }, { key: "cosmic", count: 3 }],
    effect: { kind: "slots", amount: 2 },
  },
  {
    id: "burst", name: "RED BURST", icon: "charmBurst", hue: 352,
    power: "3X CRIT PAY", description: "Crits pay three times more.",
    ingredients: [{ key: "secret", count: 3 }, { key: "mythic", count: 6 }],
    effect: { kind: "critPower", multiplier: 3 },
  },
  {
    id: "sun", name: "SUN SEAL", icon: "charmSun", hue: 45,
    power: "5X VALUE", description: "Clovers pay five times more.",
    ingredients: [{ key: "secret", count: 4 }, { key: "divine", count: 3 }],
    effect: { kind: "value", multiplier: 5 },
  },
  {
    id: "thorn", name: "THORN CHARM", icon: "charmThorn", hue: 345,
    power: "3X CURSED", description: "Find cursed clovers more often.", unlockAt: 10,
    ingredients: [{ key: "cursed", count: 1 }, { key: "cosmic", count: 3 }],
    effect: { kind: "cursed", multiplier: 3 },
  },
  {
    id: "static", name: "STATIC CHARM", icon: "charmStatic", hue: 185,
    power: "4X GLITCHED", description: "Find glitched clovers more often.", unlockAt: 15,
    ingredients: [{ key: "glitched", count: 1 }, { key: "cosmic", count: 4 }],
    effect: { kind: "glitched", multiplier: 4 },
  },
] as const satisfies readonly CharmRecipe[];

export type CharmId = (typeof CHARMS)[number]["id"];
export type CharmState = { owned: CharmId[]; equipped: CharmId[] };

export const newCharmState = (): CharmState => ({ owned: [], equipped: [] });

const slotsFrom = (equipped: readonly CharmId[]) => Math.min(
  MAX_CHARM_SLOTS,
  BASE_CHARM_SLOTS + equipped.reduce((total, id) => {
    const effect = CHARMS.find((charm) => charm.id === id)?.effect;
    return total + (effect?.kind === "slots" ? effect.amount : 0);
  }, 0),
);

export function sanitizeCharmState(raw: unknown): CharmState {
  const value = raw && typeof raw === "object" ? raw as Partial<CharmState> : {};
  const valid = (id: unknown): id is CharmId => typeof id === "string" && CHARMS.some((charm) => charm.id === id);
  const owned = Array.isArray(value.owned) ? value.owned.filter(valid).filter((id, index, ids) => ids.indexOf(id) === index) : [];
  const unique = Array.isArray(value.equipped)
    ? value.equipped.filter((id): id is CharmId => valid(id) && owned.includes(id)).filter((id, index, ids) => ids.indexOf(id) === index)
    : [];
  // Trim to the limit the equipped set itself grants, so a slot charm keeps paying for its own seat.
  const equipped = unique.slice(0, MAX_CHARM_SLOTS);
  return { owned, equipped: equipped.slice(0, slotsFrom(equipped)) };
}

export function canCraftCharm(save: Save, id: CharmId): boolean {
  const recipe = CHARMS.find((charm) => charm.id === id);
  return !!recipe && save.rebirths >= ("unlockAt" in recipe ? recipe.unlockAt : 0) && !save.charms.owned.includes(id) &&
    hasMaterials(save, recipe.ingredients);
}

export function craftCharm(save: Save, id: CharmId): Save | null {
  const recipe = CHARMS.find((charm) => charm.id === id);
  if (!recipe || !canCraftCharm(save, id)) return null;

  const materials = spendMaterials(save, recipe.ingredients, charmBonuses(save).craftSave);
  if (!materials) return null;

  const equipped = save.charms.equipped;
  return {
    ...save,
    materials,
    charms: {
      owned: [...save.charms.owned, id],
      // Auto-equip only when the new charm genuinely fits in the resulting loadout.
      equipped: equipped.length < slotsFrom([...equipped, id]) ? [...equipped, id] : [...equipped],
    },
  };
}

export function toggleCharm(save: Save, id: CharmId): Save | null {
  if (!save.charms.owned.includes(id)) return null;
  const equipped = save.charms.equipped;
  if (equipped.includes(id)) {
    const next = equipped.filter((active) => active !== id);
    // Removing a slot charm shrinks the loadout, so drop whatever no longer fits.
    return { ...save, charms: { ...save.charms, equipped: next.slice(0, slotsFrom(next)) } };
  }
  const next = [...equipped, id];
  if (next.length > slotsFrom(next)) return null;
  return { ...save, charms: { ...save.charms, equipped: next } };
}

export function charmBonuses(save: Save) {
  const bonuses = { luck: 1, value: 1, shiny: 1, crit: 0, autoPause: 1, crystal: 1, cursed: 1, glitched: 1, critPower: 1, bagYield: 0, craftSave: 0 };
  const seen = new Set<CharmId>();
  for (const id of save.charms.equipped.slice(0, MAX_CHARM_SLOTS)) {
    if (seen.has(id) || !save.charms.owned.includes(id)) continue;
    seen.add(id);
    const recipe = CHARMS.find((charm) => charm.id === id);
    if (!recipe) continue;
    const effect: CharmEffect = recipe.effect;
    if (effect.kind === "crit") bonuses.crit += effect.bonus;
    else if (effect.kind === "craftSave") bonuses.craftSave += effect.bonus;
    else if (effect.kind === "bagYield") bonuses.bagYield += effect.amount;
    else if (effect.kind === "luck") bonuses.luck *= effect.multiplier;
    else if (effect.kind === "value") bonuses.value *= effect.multiplier;
    else if (effect.kind === "shiny") bonuses.shiny *= effect.multiplier;
    else if (effect.kind === "crystal") bonuses.crystal *= effect.multiplier;
    else if (effect.kind === "cursed") bonuses.cursed *= effect.multiplier;
    else if (effect.kind === "glitched") bonuses.glitched *= effect.multiplier;
    else if (effect.kind === "autoPause") bonuses.autoPause *= effect.multiplier;
    else if (effect.kind === "critPower") bonuses.critPower *= effect.multiplier;
  }
  return bonuses;
}

/** How many charms the player can wear right now, including any equipped slot charm. */
export const charmSlotLimit = (save: Save) => slotsFrom(save.charms.equipped);
