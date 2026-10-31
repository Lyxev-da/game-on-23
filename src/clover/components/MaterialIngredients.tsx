import { fmt, type Save } from "../game/data";
import { materialFor, type Ingredient } from "../game/materials";
import { PixelIcon } from "./ui";

/** Shared material rows keep the Forge and Brewery's costs readable and identical. */
export function MaterialIngredients({ save, ingredients, label }: { save: Save; ingredients: readonly Ingredient[]; label: string }) {
  return <div className="fg-items" aria-label={label}>{ingredients.map(({ key, count }) => {
    const material = materialFor(key); const have = save.materials[key] ?? 0;
    return <span className={`fg-item material-ingredient${have >= count ? " is-ok" : ""}`} key={key} title={`${material.name}: ${have.toLocaleString("en-US")} in bag, ${count} needed. ${material.source}.`}>
      <PixelIcon name={material.icon} className="fg-item-material" /><span className="material-ingredient-name">{material.name}</span><span className="material-ingredient-count"><b>{fmt(have)}</b>/{count}</span>
    </span>;
  })}</div>;
}
