import { useState, type CSSProperties } from "react";
import { type Save } from "../game/data";
import { BASE_CHARM_SLOTS, CHARMS, charmSlotLimit, canCraftCharm, type CharmId } from "../game/charms";
import { breweryUnlocked, type PotionId } from "../game/potions";
import { Brewery } from "./Brewery";
import { Block, BlockButton, PixelIcon, PxBar } from "./ui";
import { Modal } from "./panels";
import { MaterialIngredients } from "./MaterialIngredients";

export function CharmForge({ save, storageEnabled, saveError, onCraft, onToggle, onBrew, onDrink, onClose, initialView = "charms", now = Date.now() }: {
  save: Save; storageEnabled: boolean; saveError: boolean; onCraft: (id: CharmId) => boolean; onToggle: (id: CharmId) => boolean; onBrew: (id: PotionId) => boolean; onDrink: (id: PotionId) => boolean; initialView?: "charms" | "brewery"; now?: number; onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [view, setView] = useState(initialView);
  const unlocked = breweryUnlocked(save);
  const slots = charmSlotLimit(save);
  const owned = save.charms.owned.length;
  const craft = (id: CharmId) => { const recipe = CHARMS.find((charm) => charm.id === id)!; const fits = save.charms.equipped.length < slots + (recipe.effect.kind === "slots" ? recipe.effect.amount : 0); if (onCraft(id)) setMessage(fits ? `${recipe.name} MADE AND WORN` : `${recipe.name} MADE / TAKE ONE OFF TO WEAR IT`); };
  const toggle = (id: CharmId) => { const recipe = CHARMS.find((charm) => charm.id === id)!; const worn = save.charms.equipped.includes(id); if (onToggle(id)) setMessage(`${recipe.name} ${worn ? "TAKEN OFF" : "WORN"}`); };

  return <Modal title="FORGE" headTone="tint" headHue={42} icon={view === "brewery" ? "brewery" : "forge"} onClose={onClose} className={`forge-modal${view === "brewery" ? " brewery-modal" : ""}`}
    footer={<span className="tx-label">{view === "brewery" ? "BREWERY OPENS AT REBIRTH 1. USE ONE POTION AT A TIME. BREWING SPENDS MATERIALS, NOT YOUR INDEX." : "MAKE CHARMS WITH MATERIALS FROM ANY CLOVER OF THE MATCHING RARITY. CHARMS ARE KEPT FOREVER."}</span>}>
    <div className="fg-view-tabs" role="tablist" aria-label="Forge rooms">
      <BlockButton role="tab" aria-selected={view === "charms"} tone={view === "charms" ? "tint" : "metal"} style={{ "--h": 42 } as CSSProperties} className="fg-view-tab" faceClassName="fg-view-tab-face" onClick={() => setView("charms")}><PixelIcon name="forge" className="fg-view-icon" /><span className="tx-stroke">CHARMS</span><span className="tx-label">{owned} MADE</span></BlockButton>
      <BlockButton role="tab" aria-selected={view === "brewery"} tone={view === "brewery" ? "tint" : "metal"} style={{ "--h": 330 } as CSSProperties} className="fg-view-tab" faceClassName="fg-view-tab-face" onClick={() => setView("brewery")}><PixelIcon name={unlocked ? "brewery" : "lock"} className="fg-view-icon" /><span className="tx-stroke">BREWERY</span><span className="tx-label">{unlocked ? "UNLOCKED" : "REBIRTH 1"}</span></BlockButton>
    </div>
    {view === "brewery" ? <Brewery save={save} now={now} onBrew={onBrew} onDrink={onDrink} /> : <div id="forge-charms" role="tabpanel">
      <div className="fg-top">
        <Block tone="dark" className="fg-count" faceClassName="fg-count-face"><PixelIcon name="forge" className="fg-count-icon" /><span className="fg-count-copy"><span className="tx-stroke fg-count-value">{owned}<i>/{CHARMS.length}</i></span><span className="tx-label">CHARMS MADE</span></span></Block>
        <Block className="fg-worn" faceClassName="fg-worn-face"><span className="tx-label">WORN {save.charms.equipped.length}/{slots}</span><div className="fg-slot-list">
          {Array.from({ length: slots }, (_, index) => { const id = save.charms.equipped[index]; const recipe = CHARMS.find((c) => c.id === id); return <BlockButton key={index} tone={recipe ? "tint" : "dark"} style={recipe ? ({ "--h": recipe.hue } as CSSProperties) : undefined} className={`fg-slot${index >= BASE_CHARM_SLOTS ? " is-bonus" : ""}`} faceClassName="fg-slot-face" disabled={!recipe} onClick={() => recipe && toggle(recipe.id)}>{recipe ? <PixelIcon name={recipe.icon} className="fg-slot-icon" /> : <span className="fg-slot-plus">+</span>}</BlockButton>; })}
        </div><PxBar value={owned / CHARMS.length} className="fg-bar" /><span className="tx-label fg-note">{message || "WEAR CHARMS TO GET THEIR BONUS"}</span></Block>
      </div>
      {(!storageEnabled || saveError) && <p className="offline-error">Browser storage is unavailable. New items may not survive a reload.</p>}
      <div className="fg-list">{CHARMS.map((recipe) => {
        const made = save.charms.owned.includes(recipe.id); const worn = save.charms.equipped.includes(recipe.id); const unlockAt = "unlockAt" in recipe ? recipe.unlockAt : 0; const locked = save.rebirths < unlockAt; const ready = canCraftCharm(save, recipe.id); const full = save.charms.equipped.length >= slots + (!worn && recipe.effect.kind === "slots" ? recipe.effect.amount : 0); const blocked = made ? !worn && full : !ready; const action = worn ? "TAKE OFF" : made ? full ? "NO SLOTS" : "WEAR" : locked ? "LOCKED" : ready ? "MAKE" : "NEED MORE";
        return <Block key={recipe.id} tone={worn ? "tint" : "metal"} className={`fg-charm${worn ? " is-worn" : ""}${made ? " is-made" : ""}`} faceClassName="fg-charm-face" style={{ "--h": recipe.hue } as CSSProperties}>
          <div className="fg-art"><PixelIcon name={recipe.icon} className="fg-art-icon" /></div><div className="fg-copy"><span className="tx-stroke fg-name">{recipe.name}</span><span className="tx-stroke fg-power">{recipe.power}</span><span className="tx-label fg-desc">{locked ? `UNLOCKS AT REBIRTH ${unlockAt} / ${unlockAt - save.rebirths} TO GO` : recipe.description}</span>{made ? <span className="tx-label fg-state is-made">{worn ? "WORN NOW" : "MADE / NOT WORN"}</span> : <MaterialIngredients save={save} ingredients={recipe.ingredients} label={`${recipe.name} materials`} />}</div>
          <BlockButton tone={worn ? "metal" : made ? "green" : ready ? "gold" : "metal"} disabled={blocked} className="fg-btn" faceClassName="fg-btn-face" onClick={() => made ? toggle(recipe.id) : craft(recipe.id)}><span className="tx-stroke">{action}</span></BlockButton>
        </Block>;
      })}</div>
    </div>}
  </Modal>;
}
