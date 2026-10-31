import type { RarityId, Save, Tier, Variant } from "./data";
import type { IconName } from "./icons";

type Material = {
  id: RarityId | Exclude<Variant, "normal">;
  label: string;
  name: string;
  icon: IconName;
  hue: number;
  source: string;
};

export const MATERIALS = [
  { id: "common", label: "COMMON", name: "COMMON LEAF", icon: "matCommon", hue: 132, source: "Any normal Common clover" },
  { id: "uncommon", label: "UNCOMMON", name: "MINT LEAF", icon: "matUncommon", hue: 162, source: "Any normal Uncommon clover" },
  { id: "rare", label: "RARE", name: "BLUE DEW", icon: "matRare", hue: 199, source: "Any normal Rare clover" },
  { id: "epic", label: "EPIC", name: "PURPLE DUST", icon: "matEpic", hue: 272, source: "Any normal Epic clover" },
  { id: "legendary", label: "LEGENDARY", name: "GOLD PETAL", icon: "matLegendary", hue: 45, source: "Any normal Legendary clover" },
  { id: "mythic", label: "MYTHIC", name: "RUBY CHIP", icon: "matMythic", hue: 352, source: "Any normal Mythic clover" },
  { id: "divine", label: "DIVINE", name: "HALO FEATHER", icon: "matDivine", hue: 32, source: "Any normal Divine clover" },
  { id: "cosmic", label: "COSMIC", name: "STAR DUST", icon: "matCosmic", hue: 232, source: "Any normal Cosmic clover" },
  { id: "secret", label: "SECRET", name: "PRISM CORE", icon: "matSecret", hue: 290, source: "Any normal Secret clover" },
  { id: "shiny", label: "SHINY", name: "SHINY DUST", icon: "matShiny", hue: 48, source: "Any Shiny clover, at any rarity" },
  { id: "crystal", label: "CRYSTAL", name: "CRYSTAL SHARD", icon: "matCrystal", hue: 203, source: "Any Crystal clover, at any rarity" },
  { id: "cursed", label: "CURSED", name: "CURSED ESSENCE", icon: "matCursed", hue: 345, source: "Any Cursed clover, at any rarity" },
  { id: "glitched", label: "GLITCHED", name: "GLITCH CHIP", icon: "matGlitched", hue: 185, source: "Any Glitched clover, at any rarity" },
] as const satisfies readonly Material[];

export type MaterialId = (typeof MATERIALS)[number]["id"];
export type MaterialBag = Partial<Record<MaterialId, number>>;
export type Ingredient = { key: MaterialId; count: number };
export const materialFor = (id: MaterialId) => MATERIALS.find((material) => material.id === id)!;

/** Special variants override the normal rarity drop; one roll never pays both. */
export const materialFromClover = (tier: Pick<Tier, "rarity">, variant: Variant): MaterialId =>
  variant === "normal" ? tier.rarity : variant;

export function sanitizeMaterials(raw: unknown): MaterialBag {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const materials: MaterialBag = {};
  for (const material of MATERIALS) {
    const count = value[material.id];
    if (typeof count === "number" && Number.isFinite(count) && count >= 1) {
      materials[material.id] = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(count));
    }
  }
  return materials;
}

export const materialTotal = (bag: MaterialBag) => Object.values(bag).reduce((sum, count) => sum + (count ?? 0), 0);

function recipeCosts(ingredients: readonly Ingredient[]): MaterialBag | null {
  if (!ingredients.length) return null;
  const costs: MaterialBag = {};
  for (const { key, count } of ingredients) {
    if (!MATERIALS.some((material) => material.id === key) || !Number.isSafeInteger(count) || count <= 0) return null;
    const total = (costs[key] ?? 0) + count;
    if (!Number.isSafeInteger(total)) return null;
    costs[key] = total;
  }
  return costs;
}

export const hasMaterials = (save: Save, ingredients: readonly Ingredient[]) => {
  const costs = recipeCosts(ingredients);
  return !!costs && (Object.entries(costs) as [MaterialId, number][]).every(([key, count]) => (save.materials[key] ?? 0) >= count);
};

/** Validate the complete recipe before spending; callers never get a partial craft. */
export function spendMaterials(save: Save, ingredients: readonly Ingredient[], refundChance = 0): MaterialBag | null {
  const costs = recipeCosts(ingredients);
  if (!costs || !hasMaterials(save, ingredients)) return null;
  const materials = { ...save.materials };
  for (const [key, count] of Object.entries(costs) as [MaterialId, number][]) {
    if (refundChance > 0 && Math.random() < Math.min(0.95, refundChance)) continue;
    const remaining = materials[key]! - count;
    if (remaining > 0) materials[key] = remaining;
    else delete materials[key];
  }
  return materials;
}