// @ts-nocheck
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  CRYSTAL_RARITY, CRYSTAL_REBIRTHS, CRYSTAL_VALUE, CURSED_RARITY, CURSED_REBIRTHS, CURSED_VALUE, GLITCHED_RARITY, GLITCHED_REBIRTHS, GLITCHED_VALUE, REBIRTH_LUCK, REBIRTH_MAX, REBIRTH_VALUE,
  AUTO_UNLOCK_ROLLS, RARITIES, TIERS, TOTAL_ENTRIES, UPGRADES, VARIANTS,
  autoInterval, autoUnlocked, baseLuck, canRebirth, crystalUnlocked, cursedUnlocked, discoveredCount, effectiveOdds, fmt, fmtOdds, foundKey,
  getLuck, indexBonus, luckScaleFromSlider, variantValue, rarityForChance, recommendLuckForRarity, rarityProbability, rebirthCost, rebirthLuck, rebirthValue, sliderFromLuckScale, variantBaseOdds, variantChance, variantLuck, variantUnlocked, upgradeUnlocked,
  gemsForRebirth, rebirthLeftover,
  type RarityId, type Save, type UpgradeId, type Variant,
} from "../game/data";
import { FOREVER, GEM_DIVISOR, foreverLevel, type ForeverId } from "../game/gems";
import type { CloverPackId } from "../game/ticketPacks";
import { TicketStore } from "./TicketStore";
import { OFFLINE_CAP_MS, OFFLINE_EFFICIENCY, formatAwayTime, hasOfflineEarnings, offlineCloversPerSecond } from "../game/offline";
import { BREWERY_REBIRTHS, breweryUnlocked } from "../game/potions";
import { MATERIALS, materialFor, materialFromClover, materialTotal, type MaterialId } from "../game/materials";
import { Block, BlockButton, CloverImg, IconMetric, PixelIcon, PxBar, RarityText, Switch, variantPrefix, type IconName, type Tone } from "./ui";

export function Modal({ title, headTone, headHue, icon, onClose, children, footer, className = "", dismissible = true }: {
  title: string;
  headTone: Tone;
  headHue?: number;
  icon: IconName;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  dismissible?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    (closeRef.current ?? dialogRef.current?.querySelector<HTMLButtonElement>("button") ?? dialogRef.current)?.focus();
    return () => previous?.focus();
  }, []);

  return (
    <div className="modal-overlay" onMouseDown={(event) => { if (dismissible && event.target === event.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className={`modal ${className}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled):not([tabindex='-1']), textarea:not(:disabled), select:not(:disabled), [tabindex='0']");
          if (!focusable?.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
      >
        <Block faceClassName="modal-face">
          <Block tone={headTone} className="modal-head" faceClassName="modal-head-face" style={headHue === undefined ? undefined : ({ "--h": headHue } as CSSProperties)}>
            <PixelIcon name={icon} className="modal-head-icon" />
            <span className="tx-stroke modal-title">{title}</span>
          </Block>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </Block>
        {dismissible && <BlockButton ref={closeRef} tone="red" className="modal-close" faceClassName="modal-close-face" onClick={onClose} aria-label="Close">
          <span className="tx-stroke">X</span>
        </BlockButton>}
      </div>
    </div>
  );
}

/* ---------------- shop ---------------- */

const UPGRADE_ICON: Record<UpgradeId, IconName> = { luck: "gem", value: "coin", luckyPace: "luckyPace", luckyPower: "luckyPower", auto: "auto", shiny: "sparkle", crit: "star", crystal: "boostCrystal", cursed: "boostCursed", glitched: "boostGlitched" };
const BLURB: Record<UpgradeId, string> = {
  luck: "Better odds on every rarity", value: "Every clover pays more", luckyPace: "Fewer spins between lucky rolls", luckyPower: "More luck for one lucky roll", auto: "Faster automatic spins, plus offline clovers", shiny: "Discover shimmering, 5x-value variants", crystal: "Discover gleaming, 25x-value variants", cursed: "Discover shadowy, 100x-value variants", glitched: "Discover fractured, 400x-value variants", crit: "Chance to pay 10x",
};

export function ShopModal({ save, onBuy, onBuyMax, onBuyForever, onBuyForeverMax, onBuyPack, onBuyLuck, initialView = "upgrades", onClose }: {
  save: Save;
  onBuy: (id: UpgradeId) => void;
  onBuyMax: (id: UpgradeId) => void;
  onBuyForever: (id: ForeverId) => void;
  onBuyForeverMax: (id: ForeverId) => void;
  onBuyPack: (id: CloverPackId) => void;
  onBuyLuck: () => boolean;
  initialView?: "upgrades" | "forever" | "tickets";
  onClose: () => void;
}) {
  const [view, setView] = useState<"upgrades" | "forever" | "tickets">(initialView);
  return (
    <Modal
      title="SHOP"
      headTone="green"
      icon="bag"
      onClose={onClose}
      className="shop-modal"
      footer={view === "tickets" ? undefined : <span className="tx-label">{view === "forever" ? <>CLOVER GEMS COME FROM THE CLOVERS LEFT OVER WHEN YOU REBIRTH. <b>FOREVER UPGRADES SURVIVE EVERY REBIRTH.</b></> : <>LUCK <b>x{getLuck(save).toFixed(2)}</b> / INDEX BONUS <b>+{Math.round(indexBonus(save) * 100)}%</b>{save.rebirths > 0 && <> / REBIRTH <b>x{rebirthLuck(save.rebirths).toFixed(2)}</b></>}</>}</span>}
    >
      <div className="cl-tabs is-three" role="tablist" aria-label="Shop rooms">
        <BlockButton role="tab" aria-selected={view === "upgrades"} tone={view === "upgrades" ? "green" : "metal"} className="cl-tab" faceClassName="cl-tab-face" onClick={() => setView("upgrades")}>
          <PixelIcon name="bag" className="cl-tab-icon" />
          <span className="tx-stroke cl-tab-name">UPGRADES</span>
          <span className="tx-label">SPEND CLOVERS</span>
        </BlockButton>
        <BlockButton role="tab" aria-selected={view === "forever"} tone={view === "forever" ? "tint" : "metal"} style={{ "--h": 196 } as CSSProperties} className="cl-tab" faceClassName="cl-tab-face" onClick={() => setView("forever")}>
          <PixelIcon name="cloverGem" className="cl-tab-icon" />
          <span className="tx-stroke cl-tab-name">FOREVER</span>
          <span className="tx-label">{fmt(save.cloverGems)} CLOVER GEMS</span>
        </BlockButton>
        <BlockButton role="tab" aria-selected={view === "tickets"} tone={view === "tickets" ? "tint" : "metal"} style={{ "--h": 330 } as CSSProperties} className="cl-tab" faceClassName="cl-tab-face" onClick={() => setView("tickets")}>
          <PixelIcon name="ticket" className="cl-tab-icon" />
          <span className="tx-stroke cl-tab-name">CLOVERS</span>
          <span className="tx-label" data-ticket-target>{fmt(save.tickets)} TICKETS</span>
        </BlockButton>
      </div>

      {view === "tickets" ? <TicketStore save={save} onBuy={onBuyPack} onBuyLuck={onBuyLuck} /> : view === "forever" ? (
        <div className="shop-list" role="tabpanel" aria-label="Forever upgrades">
          {FOREVER.map((def) => {
            const level = foreverLevel(save.forever, def.id);
            const maxed = level >= def.max;
            const cost = def.cost(level);
            const affordable = !maxed && Math.floor(save.cloverGems) >= cost;
            return (
              <Block key={def.id} className="shop-row" faceClassName="shop-row-face">
                <Block tone="dark" className="icon-well" faceClassName="icon-well-face">
                  <PixelIcon name={def.icon} />
                </Block>
                <div className="shop-info">
                  <span className="tx-stroke shop-name">{def.name}</span>
                  <span className="tx-label shop-blurb">{def.blurb}</span>
                  <span className="tx-label shop-effect">
                    {def.effect(level)}
                    {!maxed && <><i className="px-arrow" aria-hidden="true" /><b>{def.effect(level + 1)}</b></>}
                  </span>
                  <span className="shop-level"><PxBar value={level / def.max} /><span className="tx-label">LV {level}/{def.max}</span></span>
                </div>
                <div className="buy-controls">
                  {maxed ? (
                    <Block tone="gold" className="buy-btn" faceClassName="buy-face"><span className="tx-stroke">MAXED</span></Block>
                  ) : (
                    <>
                      <BlockButton tone={affordable ? "tint" : "metal"} style={{ "--h": 196 } as CSSProperties} disabled={!affordable} className="buy-btn" faceClassName="buy-face" onClick={() => onBuyForever(def.id)} aria-label={`Buy ${def.name} for ${fmt(cost)} clover gems`}>
                        <PixelIcon name="cloverGem" className="buy-clover" />
                        <span className="tx-stroke">{fmt(cost)}</span>
                      </BlockButton>
                      <BlockButton tone="dark" disabled={!affordable} className="max-btn" faceClassName="max-face" onClick={() => onBuyForeverMax(def.id)} aria-label={`Buy as many ${def.name} levels as you can afford`}>
                        <span className="tx-label">BUY MAX</span>
                      </BlockButton>
                    </>
                  )}
                </div>
              </Block>
            );
          })}
        </div>
      ) : (
      <div className="shop-list">
        {UPGRADES.map((upgrade) => {
          const level = save.upgrades[upgrade.id];
          const maxed = level >= upgrade.max;
          const cost = upgrade.cost(level);
          const locked = !upgradeUnlocked(save, upgrade.id);
          const affordable = !locked && save.clovers >= cost;
          const effectAt = (at: number) => upgrade.id === "auto"
            ? `${(autoInterval({ ...save, upgrades: { ...save.upgrades, auto: at } }) / 1000).toFixed(2)}s/ROLL`
            : upgrade.effect(at);
          return (
            <Block key={upgrade.id} className="shop-row" faceClassName="shop-row-face">
              <Block tone="dark" className="icon-well" faceClassName="icon-well-face">
                <PixelIcon name={UPGRADE_ICON[upgrade.id]} />
              </Block>
              <div className="shop-info">
                <span className="tx-stroke shop-name">{upgrade.name}</span>
                <span className="tx-label shop-blurb">{locked ? upgrade.id === "auto" ? `UNLOCK AFTER ${AUTO_UNLOCK_ROLLS} MANUAL ROLLS (${save.lifetime.manualRolls}/${AUTO_UNLOCK_ROLLS})` : `UNLOCKS AT REBIRTH ${upgrade.unlockAt}` : BLURB[upgrade.id]}</span>
                <span className="tx-label shop-effect">
                   {effectAt(level)}
                   {!maxed && <><i className="px-arrow" aria-hidden="true" /><b>{effectAt(level + 1)}</b></>}
                </span>
                {!locked && ["crystal", "cursed", "glitched"].includes(upgrade.id) && <span className="tx-label shop-drop-rate">DROP CHANCE {(variantChance(save, upgrade.id as Variant) * 100).toFixed(7).replace(/0+$/, "").replace(/\.$/, "")}% PER ROLL</span>}
                <span className="shop-level"><PxBar value={level / upgrade.max} /><span className="tx-label">LV {level}/{upgrade.max}</span></span>
              </div>
              <div className="buy-controls">
                {locked ? (
                  <Block tone="dark" className="buy-btn" faceClassName="buy-face"><PixelIcon name="lock" className="buy-lock-icon" /><span className="tx-stroke">LOCKED</span></Block>
                ) : maxed ? (
                  <Block tone="gold" className="buy-btn" faceClassName="buy-face"><span className="tx-stroke">MAXED</span></Block>
                ) : (
                  <>
                    <BlockButton tone={affordable ? "green" : "metal"} disabled={!affordable} className="buy-btn" faceClassName="buy-face" onClick={() => onBuy(upgrade.id)} aria-label={`Buy ${upgrade.name} for ${fmt(cost)} clovers`}>
                      <CloverImg tier={0} size="sm" className="buy-clover" />
                      <span className="tx-stroke">{fmt(cost)}</span>
                    </BlockButton>
                    <BlockButton tone="dark" disabled={!affordable} className="max-btn" faceClassName="max-face" onClick={() => onBuyMax(upgrade.id)} aria-label={`Buy as many ${upgrade.name} levels as you can afford`}>
                      <span className="tx-label">BUY MAX</span>
                    </BlockButton>
                  </>
                )}
              </div>
            </Block>
          );
        })}
      </div>
      )}
    </Modal>
  );
}

/* ---------------- offline earnings ---------------- */

function OfflineAmount({ amount, animated }: { amount: number; animated: boolean }) {
  const numberRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = numberRef.current;
    if (!element || !animated) return;
    let frame = 0;
    const start = performance.now();
    const count = (now: number) => {
      const progress = Math.min(1, (now - start) / 750);
      element.textContent = `+${fmt(Math.floor(amount * (1 - (1 - progress) ** 3)))}`;
      if (progress < 1) frame = requestAnimationFrame(count);
    };
    frame = requestAnimationFrame(count);
    return () => cancelAnimationFrame(frame);
  }, [amount, animated]);
  return <span className="tx-stroke offline-earned" role="status" aria-label={`${amount.toLocaleString("en-US")} clovers earned while away`}><span ref={numberRef} aria-hidden="true">+{fmt(amount)}</span></span>;
}

export function OfflineModal({ save, effects, storageEnabled, claimError, onClaim, onEnableAuto, onClose }: {
  save: Save;
  effects: boolean;
  storageEnabled: boolean;
  claimError: boolean;
  onClaim: () => void;
  onEnableAuto: () => void;
  onClose: () => void;
}) {
  const reward = save.offlineReward;
  const unlocked = autoUnlocked(save);
  const earning = hasOfflineEarnings(save) && storageEnabled;
  const perMinute = offlineCloversPerSecond(save) * 60;
  return (
    <Modal
      title={reward ? "WELCOME BACK!" : "OFFLINE EARNINGS"}
      headTone="gold"
      icon="offline"
      onClose={onClose}
      className="offline-modal"
      footer={<span className="tx-label">CLOVERS ONLY. YOUR RARE FINDS AND COLLECTION STAY UNCHANGED.</span>}
    >
      <div className="offline-hero">
        <div className={`offline-art${effects ? " is-animated" : ""}`} aria-hidden="true">
          <PixelIcon name="offline" className="offline-clock" />
          <CloverImg tier={0} size="md" className="offline-lucky-clover" />
          <i className="offline-spark offline-spark-a" /><i className="offline-spark offline-spark-b" />
        </div>
        <p className="tx-label offline-eyebrow">{reward ? "YOUR AUTO ROLL KEPT EARNING" : unlocked ? "A LITTLE LUCK WHILE YOU'RE AWAY" : "ROLL TO UNLOCK OFFLINE EARNINGS"}</p>
        {reward ? <OfflineAmount key={reward.id} amount={reward.amount} animated={effects} /> : <span className="tx-stroke offline-empty-title">{earning ? "READY TO EARN" : unlocked ? "AUTO ROLL IS OFF" : "UNLOCK AUTO ROLL"}</span>}
        <span className="tx-label offline-subtitle">{reward ? "CLOVERS WAITING TO BE COLLECTED" : earning ? "LEAVE AUTO ON, THEN CLOSE OR HIDE THIS TAB" : unlocked ? "OFFLINE CLOVERS NEED AUTO ROLL SWITCHED ON" : `${save.lifetime.manualRolls}/${AUTO_UNLOCK_ROLLS} MANUAL ROLLS TO UNLOCK`}</span>
      </div>

      <div className="offline-details">
        <Block tone="dark" className="offline-detail" faceClassName="offline-detail-face">
          <PixelIcon name={reward ? "offline" : "coin"} className="offline-detail-icon" />
          <span className="tx-label">{reward ? "TIME AWAY" : earning ? "RATE" : "PAUSED"}</span>
          <span className="tx-stroke">{reward ? formatAwayTime(reward.awayMs) : earning ? `${fmt(perMinute)}/MIN` : "0"}</span>
        </Block>
        <Block tone="dark" className="offline-detail" faceClassName="offline-detail-face">
          <PixelIcon name="auto" className="offline-detail-icon" />
          <span className="tx-label">{reward ? "EARNING TIME" : "BANK LIMIT"}</span>
          <span className="tx-stroke">{formatAwayTime(reward?.creditedMs ?? OFFLINE_CAP_MS)}</span>
        </Block>
      </div>
      <p className="tx-label offline-rule">{Math.round(OFFLINE_EFFICIENCY * 100)}% OF YOUR ACTIVE RATE <span>/</span> UP TO {formatAwayTime(OFFLINE_CAP_MS)}{reward?.capped ? " / BANK FULL" : ""}</p>

      {(!storageEnabled || claimError) && <p className="offline-error" role="alert">{!storageEnabled ? "Browser storage is unavailable. Enable it to save progress and bank offline rewards." : "The reward could not be saved. It is still waiting here. Please free some browser storage and try again."}</p>}
      {reward ? (
        <>
          <BlockButton tone="green" className="offline-collect" faceClassName="offline-collect-face" disabled={!storageEnabled} onClick={onClaim} aria-label={`Collect ${reward.amount.toLocaleString("en-US")} offline clovers`}>
            <PixelIcon name="coin" className="offline-collect-icon" /><span className="tx-stroke">COLLECT {fmt(reward.amount)}</span>
          </BlockButton>
          <button className="offline-later tx-label" type="button" onClick={onClose}>COLLECT LATER</button>
        </>
      ) : (
        <BlockButton tone={earning ? "gold" : "green"} className="offline-collect" faceClassName="offline-collect-face" disabled={!storageEnabled} onClick={earning ? onClose : unlocked ? onEnableAuto : onClose}>
          <PixelIcon name={earning ? "offline" : unlocked ? "auto" : "dice"} className="offline-collect-icon" /><span className="tx-stroke">{earning ? "SOUNDS GOOD!" : unlocked ? "TURN AUTO ON" : "KEEP ROLLING"}</span>
        </BlockButton>
      )}
    </Modal>
  );
}

/* ---------------- rebirth ---------------- */

export function RebirthModal({ save, onRebirth, onOpenBrewery, onClose }: { save: Save; onRebirth: () => void; onOpenBrewery: () => void; onClose: () => void }) {
  const cost = rebirthCost(save.rebirths);
  const ready = canRebirth(save);
  const leftover = rebirthLeftover(save);
  const gems = gemsForRebirth(save);
  const brewery = breweryUnlocked(save);
  const maxed = save.rebirths >= REBIRTH_MAX;
  const crystals = crystalUnlocked(save);
  const toCrystal = Math.max(0, CRYSTAL_REBIRTHS - save.rebirths);
  const cursed = cursedUnlocked(save);
  const toCursed = Math.max(0, CURSED_REBIRTHS - save.rebirths);
  const glitched = save.rebirths >= GLITCHED_REBIRTHS;
  const progress = Math.min(1, save.clovers / cost);

  return (
    <Modal title="REBIRTH" headTone="tint" headHue={330} icon="rebirth" onClose={onClose} className="rebirth-modal" footer={<span className="tx-label">KEEPS THE INDEX, MATERIALS, CHARMS, POTIONS, CLOVER GEMS, FOREVER UPGRADES AND SETTINGS. WIPES CLOVER CURRENCY AND SHOP UPGRADES.</span>}>
      <div className="rb-top">
        <Block tone="dark" className="rb-count" faceClassName="rb-count-face">
          <PixelIcon name="rebirth" className="rb-count-icon" />
          <span className="rb-count-copy">
            <span className="tx-stroke rb-count-value">{save.rebirths}</span>
            <span className="tx-label">REBIRTHS</span>
          </span>
        </Block>
        <div className="rb-bonuses">
          <Block className="rb-bonus" faceClassName="rb-bonus-face">
            <PixelIcon name="gem" className="rb-bonus-icon" />
            <span className="tx-label">LUCK</span>
            <span className="tx-stroke rb-bonus-value">x{rebirthLuck(save.rebirths).toFixed(2)}</span>
            {!maxed && <span className="tx-label rb-next"><i className="px-arrow" aria-hidden="true" /><b>x{rebirthLuck(save.rebirths + 1).toFixed(2)}</b></span>}
          </Block>
          <Block className="rb-bonus" faceClassName="rb-bonus-face">
            <PixelIcon name="coin" className="rb-bonus-icon" />
            <span className="tx-label">VALUE</span>
            <span className="tx-stroke rb-bonus-value">x{rebirthValue(save.rebirths).toFixed(2)}</span>
            {!maxed && <span className="tx-label rb-next"><i className="px-arrow" aria-hidden="true" /><b>x{rebirthValue(save.rebirths + 1).toFixed(2)}</b></span>}
          </Block>
        </div>
      </div>

      <Block className="rb-cost" faceClassName="rb-cost-face">
        <span className="tx-label">NEXT REBIRTH COSTS</span>
        <span className="rb-cost-line">
          <CloverImg tier={0} size="sm" className="rb-cost-clover" />
          <span className="tx-stroke rb-cost-value">{fmt(cost)}</span>
        </span>
        <PxBar value={progress} className="rb-bar" />
        <div className="metric-strip"><IconMetric icon="coin" value={`${fmt(save.clovers)}/${fmt(cost)}`} title="Current clovers and rebirth cost" /><IconMetric icon="gem" value={`+${Math.round(REBIRTH_LUCK * 100)}%`} title="Permanent luck" /><IconMetric icon="coin" value={`+${Math.round(REBIRTH_VALUE * 100)}%`} title="Permanent value" /></div>
        <span className="tx-label">YOU HAVE <b>{fmt(save.clovers)}</b> {ready ? "" : `/ ${Math.round(progress * 100)}%`}</span>
        <span className="tx-label rb-perks">+{Math.round(REBIRTH_LUCK * 100)}% LUCK AND +{Math.round(REBIRTH_VALUE * 100)}% VALUE, FOREVER</span>
        {maxed ? (
          <Block tone="gold" className="rb-btn" faceClassName="rb-btn-face"><span className="tx-stroke">MAX REBIRTHS</span></Block>
        ) : (
          <BlockButton tone={ready ? "tint" : "metal"} style={ready ? ({ "--h": 330 } as CSSProperties) : undefined} disabled={!ready} className="rb-btn" faceClassName="rb-btn-face" onClick={onRebirth}>
            <PixelIcon name="rebirth" className="rb-btn-icon" />
            <span className="tx-stroke">{ready ? "REBIRTH NOW" : "NOT YET"}</span>
          </BlockButton>
        )}
      </Block>

      <Block tone="tint" className="rb-cost rb-gems" faceClassName="rb-cost-face" style={{ "--h": 196 } as CSSProperties}>
        <span className="tx-label">LEFTOVER CLOVERS BECOME CLOVER GEMS</span>
        <span className="rb-cost-line">
          <PixelIcon name="cloverGem" className="rb-cost-clover" />
          <span className="tx-stroke rb-cost-value">+{fmt(gems)}</span>
        </span>
        <div className="metric-strip"><IconMetric icon="coin" value={fmt(leftover)} title="Leftover clovers" /><IconMetric icon="cloverGem" value={fmt(gems)} title="Clover gems minted" /><IconMetric icon="dial" value={`√/${GEM_DIVISOR}`} title="Conversion formula" /></div>
        <span className="tx-label">YOU KEEP <b>{fmt(leftover)}</b> CLOVERS AFTER THE COST / ROOT OF THE LEFTOVER, DIVIDED BY {GEM_DIVISOR}</span>
        <span className="tx-label rb-perks">HOARDING HELPS LESS AND LESS. GEMS ARE KEPT FOREVER AND SPENT IN THE SHOP.</span>
      </Block>

      <Block tone={brewery ? "tint" : "dark"} className={`rb-crystal rb-brewery${brewery ? " is-open" : ""}`} faceClassName="rb-crystal-face" style={{ "--h": 42 } as CSSProperties}>
        <div className="rb-crystal-art"><PixelIcon name="brewery" muted={!brewery} className="rb-crystal-clover" /></div>
        <div className="rb-crystal-copy">
          <span className="tx-stroke rb-crystal-title">BREWERY</span>
          <span className="tx-label rb-crystal-stat">POTIONS WITH INSANE, TIMED BUFFS</span>
          <span className={`tx-label rb-crystal-state${brewery ? " is-unlocked" : ""}`}>{brewery ? "UNLOCKED. BREW THEM IN THE FORGE." : `UNLOCKS AT REBIRTH ${BREWERY_REBIRTHS} / ${BREWERY_REBIRTHS - save.rebirths} TO GO`}</span>
          <IconMetric icon={brewery ? "brewery" : "rebirth"} value={brewery ? "1" : `${save.rebirths}/${BREWERY_REBIRTHS}`} title="Brewery unlock" />
          <BlockButton tone={brewery ? "gold" : "metal"} className="rb-brewery-btn" faceClassName="rb-btn-face" disabled={!brewery} onClick={onOpenBrewery} aria-label="Open brewery in the forge">
            <PixelIcon name={brewery ? "brewery" : "lock"} className="rb-btn-icon" />
            <span className="tx-stroke">{brewery ? "OPEN BREWERY" : "LOCKED"}</span>
          </BlockButton>
        </div>
      </Block>

      <Block tone={crystals ? "tint" : "dark"} className={`rb-crystal${crystals ? " is-open" : ""}`} faceClassName="rb-crystal-face" style={{ "--h": 203 } as CSSProperties}>
        <div className="rb-crystal-art">
          <CloverImg tier={0} variant="crystal" className="rb-crystal-clover" locked={!crystals} sparkles={crystals} animated={crystals} />
        </div>
        <div className="rb-crystal-copy">
          <RarityText tier={0} crystal animated={crystals} className="rb-crystal-title">CRYSTAL CLOVERS</RarityText>
          <div className="metric-strip"><IconMetric icon="coin" value={`x${CRYSTAL_VALUE}`} title="Value" /><IconMetric icon="crystal" value={`1:${CRYSTAL_RARITY}`} title="Relative rarity" /></div>
          <span className="tx-label rb-crystal-stat"><b>{CRYSTAL_VALUE}x</b> CLOVERS PER ROLL / <b>{CRYSTAL_RARITY}x</b> HARDER THAN SHINY</span>
          {crystals ? (
            <span className="tx-label rb-crystal-state is-unlocked">UNLOCKED</span>
          ) : (
            <>
              <IconMetric icon="rebirth" value={`${save.rebirths}/${CRYSTAL_REBIRTHS}`} title={`${toCrystal} rebirths remaining`} />
              <span className="tx-label rb-crystal-state">UNLOCKS AT {CRYSTAL_REBIRTHS} REBIRTHS / {toCrystal} TO GO</span>
              <span className="rb-pips" aria-hidden="true">
                {Array.from({ length: CRYSTAL_REBIRTHS }, (_, i) => <i key={i} className={`px${i < save.rebirths ? " is-on" : ""}`} />)}
              </span>
            </>
          )}
        </div>
      </Block>

      <Block tone={cursed ? "tint" : "dark"} className={`rb-crystal rb-cursed${cursed ? " is-open" : ""}`} faceClassName="rb-crystal-face" style={{ "--h": 345 } as CSSProperties}>
        <div className="rb-crystal-art">
          <CloverImg tier={0} variant="cursed" className="rb-crystal-clover" locked={!cursed} sparkles={cursed} animated={cursed} />
        </div>
        <div className="rb-crystal-copy">
          <RarityText tier={0} variant="cursed" animated={cursed} className="rb-crystal-title">CURSED CLOVERS</RarityText>
          <div className="metric-strip"><IconMetric icon="coin" value={`x${CURSED_VALUE}`} title="Value" /><IconMetric icon="cursed" value={`1:${CURSED_RARITY}`} title="Relative rarity" /></div>
          <span className="tx-label rb-crystal-stat"><b>{CURSED_VALUE}x</b> CLOVERS PER ROLL / <b>{CURSED_RARITY}x</b> HARDER THAN CRYSTAL</span>
          {cursed ? (
            <span className="tx-label rb-crystal-state is-unlocked">UNLOCKED</span>
          ) : (
            <>
              <IconMetric icon="rebirth" value={`${save.rebirths}/${CURSED_REBIRTHS}`} title={`${toCursed} rebirths remaining`} />
              <span className="tx-label rb-crystal-state">UNLOCKS AT {CURSED_REBIRTHS} REBIRTHS / {toCursed} TO GO</span>
              <span className="rb-pips rb-pips-cursed" aria-hidden="true">
                {Array.from({ length: CURSED_REBIRTHS }, (_, i) => <i key={i} className={`px${i < save.rebirths ? " is-on" : ""}`} />)}
              </span>
            </>
          )}
        </div>
      </Block>
      <Block tone={glitched ? "tint" : "dark"} className={`rb-crystal rb-glitched${glitched ? " is-open" : ""}`} faceClassName="rb-crystal-face" style={{ "--h": 185 } as CSSProperties}>
        <div className="rb-crystal-art"><CloverImg tier={0} variant="glitched" className="rb-crystal-clover" locked={!glitched} sparkles={glitched} animated={glitched} /></div>
        <div className="rb-crystal-copy">
          <RarityText tier={0} variant="glitched" animated={glitched} className="rb-crystal-title">GLITCHED CLOVERS</RarityText>
          <div className="metric-strip"><IconMetric icon="coin" value={`x${GLITCHED_VALUE}`} title="Value" /><IconMetric icon="glitched" value={`1:${GLITCHED_RARITY}`} title="Relative rarity" /><IconMetric icon="rebirth" value={`${Math.min(save.rebirths, GLITCHED_REBIRTHS)}/${GLITCHED_REBIRTHS}`} title="Unlock progress" /></div>
          <span className="tx-label rb-crystal-stat"><b>{GLITCHED_VALUE}x</b> CLOVERS PER ROLL / <b>{GLITCHED_RARITY}x</b> HARDER THAN CURSED</span>
          <span className={`tx-label rb-crystal-state${glitched ? " is-unlocked" : ""}`}>{glitched ? "UNLOCKED. LUCK HAS BREACHED THE SYSTEM." : `UNLOCKS AT ${GLITCHED_REBIRTHS} REBIRTHS / ${GLITCHED_REBIRTHS - save.rebirths} TO GO`}</span>
          {!glitched && <span className="rb-pips rb-pips-glitched" aria-hidden="true">{Array.from({ length: GLITCHED_REBIRTHS }, (_, i) => <i key={i} className={`px${i < save.rebirths ? " is-on" : ""}`} />)}</span>}
        </div>
      </Block>
    </Modal>
  );
}

/* ---------------- all-time stats ---------------- */

function formatPlay(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/** Everything the player has done across the whole save, rebirths included. */
function allTimeStats(save: Save): Array<{ icon: IconName; label: string; value: string }> {
  const l = save.lifetime;
  const rarest = l.rarest ? `${variantPrefix(l.rarest.variant)}${TIERS[l.rarest.tier].name}` : "NONE YET";
  return [
    { icon: "coin", label: "CLOVERS EARNED", value: fmt(save.totalEarned) },
    { icon: "dice", label: "TOTAL ROLLS", value: fmt(l.rolls) },
    { icon: "dice", label: "MANUAL ROLLS", value: fmt(l.manualRolls) },
    { icon: "forge", label: "CHARMS FORGED", value: fmt(save.charms.owned.length) },
    { icon: "book", label: "DISCOVERIES", value: `${fmt(discoveredCount(save))}/${TOTAL_ENTRIES}` },
    { icon: "shine", label: "SHINIES", value: fmt(l.shinies) },
    { icon: "crystal", label: "CRYSTALS", value: fmt(l.crystals) },
    { icon: "cursed", label: "CURSED", value: fmt(l.cursed) },
    { icon: "glitched", label: "GLITCHED", value: fmt(l.glitched) },
    { icon: "star", label: "CRIT ROLLS", value: fmt(l.crits) },
    { icon: "rebirth", label: "REBIRTHS", value: fmt(l.rebirths) },
    { icon: "cloverGem", label: "CLOVER GEMS MINTED", value: fmt(save.totalGems) },
    { icon: "bolt", label: "BIGGEST ROLL", value: fmt(l.biggest) },
    { icon: "crown", label: "RAREST FIND", value: rarest },
    { icon: "offline", label: "OFFLINE EARNED", value: fmt(save.totalOfflineEarned) },
    { icon: "speed", label: "PLAY TIME", value: formatPlay(l.playMs) },
  ];
}

/* ---------------- settings ---------------- */

export function SettingsModal({ save, onToggleSound, onTogglePerformance, onLuckScale, onReset, onAdmin, onClose }: {
  save: Save;
  onToggleSound: () => void;
  onTogglePerformance: () => void;
  onLuckScale: (v: number) => void;
  onReset: () => void;
  onAdmin: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [targetRarity, setTargetRarity] = useState<RarityId>("common");
  const recommended = recommendLuckForRarity(save, targetRarity);
  const showLuck = (n: number) => n < 0.01 ? n.toFixed(4) : n < 100 ? n.toFixed(2) : fmt(n);
  const rows: Array<{ name: string; blurb: string; icon: IconName; on: boolean; toggle: () => void }> = [
    { name: "SOUND", blurb: "Rolls and reveals", icon: save.sound ? "soundOn" : "soundOff", on: save.sound, toggle: onToggleSound },
    { name: "PERFORMANCE", blurb: "No particles or motion", icon: "speed", on: save.performance, toggle: onTogglePerformance },
  ];
  return (
    <Modal title="SETTINGS" headTone="tint" headHue={205} icon="gear" onClose={onClose}>
      <div className="set-list">
        {rows.map((row) => (
          <Block className="set-row" faceClassName="set-row-face" key={row.name}>
            <Block tone="dark" className="icon-well" faceClassName="icon-well-face"><PixelIcon name={row.icon} /></Block>
            <div className="set-info"><span className="tx-stroke set-name">{row.name}</span><span className="tx-label set-blurb">{row.blurb}</span></div>
            <Switch on={row.on} onToggle={row.toggle} ariaLabel={`Toggle ${row.name.toLowerCase()}`} />
          </Block>
        ))}

        <Block className="set-row" faceClassName="set-row-face is-tall">
          <Block tone="dark" className="icon-well" faceClassName="icon-well-face"><PixelIcon name="dial" /></Block>
          <div className="set-info luck-setting">
            <span className="tx-stroke set-name">LUCK DIAL</span>
            <span className="tx-label set-blurb">Slide to choose your luck. Lower luck helps find common clovers.</span>
            <div className="luck-slider-head">
              <label className="tx-label" htmlFor="luck-dial-slider">CURRENT LUCK</label>
              <span className="tx-stroke">x{showLuck(getLuck(save))}</span>
            </div>
            <input
              id="luck-dial-slider"
              className="luck-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderFromLuckScale(save.luckScale)}
              style={{ "--dial-fill": `${sliderFromLuckScale(save.luckScale)}%` } as CSSProperties}
              onChange={(event) => onLuckScale(luckScaleFromSlider(Number(event.currentTarget.value)))}
              aria-label="Luck dial. Slide from one thousandth to full luck"
            />
            <div className="luck-slider-ends tx-label"><span>1/1000 LUCK</span><span>FULL LUCK</span></div>
            <div className="luck-target">
              <PixelIcon name={materialFor(targetRarity).icon} className="luck-target-clover" />
              <div className="luck-target-control">
                <label className="tx-label" htmlFor="luck-target-select">FIND A RARITY</label>
                <select id="luck-target-select" className="luck-target-select" value={targetRarity} onChange={(event) => setTargetRarity(event.currentTarget.value as RarityId)}>
                  {RARITIES.map((rarity) => <option key={rarity.id} value={rarity.id}>{rarity.label}</option>)}
                </select>
              </div>
            </div>
            <div className="luck-recommendation">
              <span className="tx-label">BEST ODDS IN THE DIAL RANGE</span>
              <span className="tx-stroke">x{showLuck(recommended.luck)} LUCK</span>
              <span className="tx-label">NOW 1 IN {fmtOdds(1 / Math.max(1e-12, rarityProbability(targetRarity, getLuck(save))))} / AT BEST 1 IN {fmtOdds(1 / Math.max(1e-12, recommended.chance))}</span>
              <BlockButton tone="green" className="luck-apply" faceClassName="luck-apply-face" onClick={() => onLuckScale(recommended.scale)} disabled={save.luckScale === recommended.scale}>
                <span className="tx-stroke">{save.luckScale === recommended.scale ? "USING BEST" : "USE BEST LUCK"}</span>
              </BlockButton>
              <span className="tx-label">COUNTS EVERY CLOVER IN THE {targetRarity.toUpperCase()} RARITY.</span>
            </div>
            <span className="tx-label set-note">FULL LUCK x{showLuck(baseLuck(save))} / RECOMMENDATIONS USE YOUR CURRENT UPGRADES AND BUFFS.</span>
          </div>
        </Block>

        <h3 className="tx-stroke index-heading">ALL-TIME STATS</h3>
        <div className="stat-grid">
          {allTimeStats(save).map((stat) => (
            <Block key={stat.label} tone="dark" className="stat-tile" faceClassName="stat-tile-face">
              <PixelIcon name={stat.icon} className="stat-tile-icon" />
              <span className="tx-label stat-tile-label">{stat.label}</span>
              <span className="tx-stroke stat-tile-value">{stat.value}</span>
            </Block>
          ))}
        </div>

        <Block tone="red" className="set-row" faceClassName="set-row-face">
          <Block tone="dark" className="icon-well" faceClassName="icon-well-face"><PixelIcon name="lock" /></Block>
          <div className="set-info"><span className="tx-stroke set-name">RESET</span><span className="tx-label set-blurb">Wipe all progress</span></div>
          <BlockButton tone="dark" className="reset-btn" faceClassName="reset-face" onClick={onReset}><span className="tx-stroke">WIPE</span></BlockButton>
        </Block>

        <input
          className="secret-code" type="password" name="code" maxLength={8} value={code} autoComplete="off" spellCheck={false} aria-label="Code"
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value.trim() === "555") { setCode(""); onAdmin(); } else setCode(value);
          }}
          onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Escape") event.currentTarget.blur(); }}
        />
      </div>
    </Modal>
  );
}

/* ---------------- index ---------------- */

const VARIANT_TABS: Record<Variant, { label: string; icon?: IconName; tone: Tone; hue?: number; needs: number }> = {
  normal: { label: "NORMAL", tone: "green", needs: 0 },
  shiny: { label: "SHINY", icon: "shine", tone: "gold", needs: 0 },
  crystal: { label: "CRYSTAL", icon: "crystal", tone: "tint", hue: 203, needs: CRYSTAL_REBIRTHS },
  cursed: { label: "CURSED", icon: "cursed", tone: "tint", hue: 345, needs: CURSED_REBIRTHS },
  glitched: { label: "GLITCHED", icon: "glitched", tone: "tint", hue: 185, needs: GLITCHED_REBIRTHS },
};

export function IndexModal({ save, onClose }: { save: Save; onClose: () => void }) {
  const luck = getLuck(save);
  const found = discoveredCount(save);
  const [view, setView] = useState<"bag" | "index">("bag");
  const [tab, setTab] = useState<Variant>("normal");
  const [detail, setDetail] = useState<{ tier: number; variant: Variant } | null>(null);
  const bagTotal = materialTotal(save.materials);
  // A variant you have found before stays browsable even if you somehow lost the unlock.
  const foundIn = (variant: Variant) => TIERS.reduce((n, _t, i) => n + ((save.found[foundKey(i, variant)] ?? 0) > 0 ? 1 : 0), 0);
  const open = (variant: Variant) => variantUnlocked(save, variant) || foundIn(variant) > 0;
  const active = open(tab) ? tab : "normal";
  /** Real per-roll chance of this variant on any clover, shown on the tab so the odds stop being a mystery. */
  const oddsFor = (variant: Variant) => {
    const chance = variantChance(save, variant);
    return chance > 0 ? 1 / chance : Infinity;
  };
  const oddsText = (variant: Variant) => (open(variant) ? `1 IN ${fmtOdds(oddsFor(variant))}` : "LOCKED");

  const card = (tier: number, variant: Variant) => {
    const key = foundKey(tier, variant);
    const count = save.found[key] ?? 0;
    const unlocked = count > 0 || (tier === 0 && variant === "normal");
    const t = TIERS[tier];
    const base = t.chance * variantBaseOdds(variant);
    const chance = variantChance(save, variant);
    const now = chance > 0 ? effectiveOdds(tier, luck) / chance : Infinity;
    const prestige = count > 0 && t.drama >= 3;
    const face = (
      <Block className={`index-card is-${variant}-card${unlocked ? "" : " is-undiscovered"}${prestige ? " is-prestige" : ""}`} faceClassName="index-card-face">
        <RarityText tier={tier} variant={variant} className="index-rarity">{variantPrefix(variant)}{t.label}</RarityText>
        <CloverImg tier={tier} variant={variant} locked={!unlocked} className="index-clover" />
        <span className="tx-stroke index-name">{unlocked ? t.name : "???"}</span>
        {t.added && <span className="index-new-mark">NEW CLOVER</span>}
        <span className="tx-label index-odds">1 IN {fmtOdds(base)}</span>
        <span className="tx-label index-now">NOW 1 IN {fmtOdds(now)}</span>
        <span className={`tx-label index-count${count ? " is-found" : ""}`}>{count ? `x${fmt(count)} FOUND` : unlocked ? "STARTER" : "NOT FOUND"}</span>
        <span className="tx-label index-stock">GIVES {materialFor(materialFromClover(t, variant)).name}</span>
      </Block>
    );
    return unlocked ? (
      <button key={key} type="button" className="index-card-btn" onClick={() => setDetail({ tier, variant })} aria-label={`Inspect ${variantPrefix(variant).toLowerCase()}${t.name}`}>{face}</button>
    ) : <div key={key} className="index-card-btn is-static">{face}</div>;
  };

  return (
    <Modal title="CLOVERS" headTone="green" icon="chest" onClose={onClose} className="index-modal" footer={<span className="tx-label">{view === "bag" ? "CLOVERS AUTOMATICALLY BECOME MATERIALS. SPECIAL VARIANTS GIVE THEIR OWN MATERIAL INSTEAD. YOUR INDEX IS KEPT." : <>EVERY DISCOVERY GIVES <b>+10% LUCK</b>. VARIANT ODDS SCALE WITH LUCK, AND THE TAB ODDS ARE PER ROLL ON ANY TIER.</>}</span>}>
      <div className="cl-tabs" role="tablist" aria-label="Clover views">
        <BlockButton role="tab" aria-selected={view === "bag"} tone={view === "bag" ? "green" : "metal"} className="cl-tab" faceClassName="cl-tab-face" onClick={() => setView("bag")}>
          <PixelIcon name="chest" className="cl-tab-icon" />
          <span className="tx-stroke cl-tab-name">MATERIALS</span>
          <span className="tx-label">{fmt(bagTotal)} TO SPEND</span>
        </BlockButton>
        <BlockButton role="tab" aria-selected={view === "index"} tone={view === "index" ? "tint" : "metal"} style={{ "--h": 272 } as CSSProperties} className="cl-tab" faceClassName="cl-tab-face" onClick={() => setView("index")}>
          <CloverImg tier={0} size="sm" effects={false} sparkles={false} className="cl-tab-icon" />
          <span className="tx-stroke cl-tab-name">INDEX</span>
          <span className="tx-label">{found}/{TOTAL_ENTRIES} FOUND</span>
        </BlockButton>
      </div>

      {view === "bag" ? (
        <>
          <Block className="cl-summary" faceClassName="cl-summary-face">
            <span className="tx-label">CRAFTING MATERIALS</span>
            <span className="cl-summary-line">
              <PixelIcon name="matCommon" className="cl-summary-clover" />
              <span className="tx-stroke cl-summary-value">{fmt(bagTotal)}</span>
            </span>
            <span className="tx-label">9 RARITY MATERIALS + 4 VARIANT MATERIALS / SPEND THEM IN THE FORGE</span>
          </Block>
          <div className="material-groups" role="tabpanel" aria-label="Crafting material inventory">
            <p className="tx-label material-help">ANY CLOVER OF A RARITY GIVES ITS MATERIAL. SHINY, CRYSTAL, CURSED AND GLITCHED GIVE A SPECIAL MATERIAL INSTEAD.</p>
            {["RARITY MATERIALS", "VARIANT MATERIALS"].map((heading, group) => (
              <section key={heading}>
                <h3 className="tx-stroke index-heading">{heading}</h3>
                <div className="bag-grid material-grid">
                  {MATERIALS.slice(group === 0 ? 0 : 9, group === 0 ? 9 : undefined).map((material) => (
                    <Block key={material.id} className={`bag-item material-item${(save.materials[material.id] ?? 0) > 0 ? " has-stock" : ""}`} faceClassName="bag-item-face">
                      <PixelIcon name={material.icon} className="bag-item-clover" />
                      <span className="bag-item-copy">
                        <span className="tx-label material-kind" style={{ color: `hsl(${material.hue} 60% 27%)` }}>{material.label}</span>
                        <span className="tx-stroke bag-item-name">{material.name}</span>
                        <span className="tx-label material-source">{material.source}</span>
                        <span className="tx-stroke material-count">x{fmt(save.materials[material.id] ?? 0)}</span>
                      </span>
                    </Block>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="index-progress">
        <span className="tx-stroke index-progress-title">DISCOVERED {found}/{TOTAL_ENTRIES}</span>
        <PxBar value={found / TOTAL_ENTRIES} className="index-bar" />
        <span className="tx-label">INDEX BONUS <b>+{Math.round(indexBonus(save) * 100)}% LUCK</b></span>
        <span className="tx-label index-variant-note">VARIANT LUCK <b>x{variantLuck(save).toFixed(2)}</b> / TAB ODDS ARE PER ROLL ON ANY TIER</span>
      </div>

      <div className="index-tabs" role="tablist" aria-label="Clover variants">
        {VARIANTS.map((variant) => {
          const spec = VARIANT_TABS[variant];
          const unlocked = open(variant);
          const selected = active === variant;
          return (
            <BlockButton
              key={variant}
              role="tab"
              aria-selected={selected}
              aria-pressed={selected}
              aria-disabled={!unlocked}
              disabled={!unlocked}
              tone={selected ? spec.tone : unlocked ? "metal" : "dark"}
              style={spec.hue !== undefined ? ({ "--h": spec.hue } as CSSProperties) : undefined}
              className={`index-tab is-${variant}-tab${selected ? " is-active" : ""}${unlocked ? "" : " is-locked"}`}
              faceClassName="index-tab-face"
              onClick={() => setTab(variant)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                const tabs = Array.from(event.currentTarget.closest("[role='tablist']")?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
                const current = tabs.indexOf(event.currentTarget);
                const target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
                event.preventDefault(); tabs[target]?.focus(); tabs[target]?.click();
              }}
              aria-label={unlocked ? `Show ${spec.label.toLowerCase()} clovers, ${foundIn(variant)} of ${TIERS.length} found` : `${spec.label.toLowerCase()} clovers unlock at ${spec.needs} rebirths`}
              title={unlocked ? undefined : `${save.rebirths}/${spec.needs}`}
            >
              {spec.icon ? (
                <PixelIcon name={unlocked ? spec.icon : "lock"} muted={!unlocked} className="index-tab-icon" />
              ) : (
                <CloverImg tier={0} size="sm" sparkles={false} effects={false} className="index-tab-icon" />
              )}
              <span className="index-tab-copy">
                <span className="tx-stroke index-tab-name">{spec.label}</span>
                  <span className="tx-label index-tab-count">{unlocked ? `${foundIn(variant)}/${TIERS.length}` : `${spec.needs} REBIRTHS`}</span>
                {unlocked && variant !== "normal" && (
                  <span className="tx-label index-tab-odds">1 IN {fmtOdds(oddsFor(variant))}</span>
                )}
              </span>
            </BlockButton>
          );
        })}
      </div>

      <h3 className={`tx-stroke index-heading is-${active}-heading`}>
        {VARIANT_TABS[active].icon && <PixelIcon name={VARIANT_TABS[active].icon!} className="index-heading-icon" />}
        {VARIANT_TABS[active].label} CLOVERS
      </h3>
      <div className="index-groups" role="tabpanel">
        {RARITIES.map((rarity) => (
          <section className="index-group" key={rarity.id} aria-label={`${rarity.label.toLowerCase()} clovers`}>
            {(() => {
              const members = TIERS.map((clover, i) => ({ clover, i })).filter(({ clover }) => clover.rarity === rarity.id);
              const got = members.filter(({ i }) => (save.found[foundKey(i, active)] ?? 0) > 0).length;
              const complete = got === members.length;
              return (
                <h4 className={`tx-stroke index-rarity-heading${complete ? " is-complete" : ""}`} style={{ color: rarity.color }}>
                  {rarity.label}
                  <span className="index-rarity-count">{got}/{members.length}</span>
                  {complete && <span className="index-rarity-done">COMPLETE</span>}
                </h4>
              );
            })()}
            <div className="index-grid">{TIERS.map((clover, i) => clover.rarity === rarity.id ? card(i, active) : null)}</div>
          </section>
        ))}
      </div>
        </>
      )}
      {detail && <CloverDetail save={save} tier={detail.tier} variant={detail.variant} onClose={() => setDetail(null)} />}
    </Modal>
  );
}

/** A close look at one discovered clover: odds, history and what it pays. */
function CloverDetail({ save, tier, variant, onClose }: { save: Save; tier: number; variant: Variant; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const t = TIERS[tier];
  const key = foundKey(tier, variant);
  const count = save.found[key] ?? 0;
  const first = save.firstFound?.[key];
  const chance = variantChance(save, variant);
  const nowOdds = chance > 0 ? effectiveOdds(tier, getLuck(save)) / chance : Infinity;
  const hue = variant === "glitched" ? 185 : variant === "cursed" ? 345 : variant === "crystal" ? 203 : t.hue;
  const stats: Array<[IconName, string, string]> = [
    ["dice", `1 IN ${fmtOdds(t.chance * variantBaseOdds(variant))}`, "BASE ODDS"],
    ["gem", `1 IN ${fmtOdds(nowOdds)}`, "YOUR ODDS NOW"],
    ["book", count ? fmt(count) : "STARTER", "TIMES FOUND"],
    ["calendar", first ? new Date(first).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }).toUpperCase() : "BEFORE TRACKING", "FIRST FOUND"],
    ["coin", `${fmt(Math.round(t.value * variantValue(variant)))} CLOVERS`, "BASE PAYOUT"],
    [materialFor(materialFromClover(t, variant)).icon, materialFor(materialFromClover(t, variant)).name, "MATERIAL"],
  ];
  return (
    <div className="cd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}>
      <div className="cd" role="dialog" aria-modal="true" aria-label={`${variantPrefix(variant)}${t.name}`} style={{ "--h": hue } as CSSProperties}>
        <Block faceClassName="cd-face">
          <div className="cd-art"><i className="cd-glow" aria-hidden="true" /><CloverImg tier={tier} variant={variant} size="lg" animated className="cd-clover" /></div>
          <div className="cd-copy">
            <RarityText tier={tier} variant={variant} animated className="cd-rarity">{variantPrefix(variant)}{t.label}</RarityText>
            <span className="tx-stroke cd-name">{t.name.toUpperCase()}</span>
            <span className="tx-label cd-effect">{t.effect}</span>
            <div className="cd-stats">
              {stats.map(([icon, value, title]) => (
                <Block key={title} tone="dark" className="cd-stat" faceClassName="cd-stat-face">
                  <PixelIcon name={icon} className="cd-stat-icon" /><span className="tx-label">{title}</span><span className="tx-stroke">{value}</span>
                </Block>
              ))}
            </div>
          </div>
        </Block>
        <BlockButton ref={closeRef} tone="red" className="modal-close" faceClassName="modal-close-face" onClick={onClose} aria-label="Close clover details">
          <span className="tx-stroke">X</span>
        </BlockButton>
      </div>
    </div>
  );
}

/* ---------------- reveals ---------------- */

export type RevealData = { key: number; tier: number; variant: Variant; lucky: boolean; luckyMultiplier: number; crit: boolean; critMultiplier: number; value: number; isNew: boolean; material: MaterialId; materialAmount: number; odds: number };

/** Small drop-down banner for repeat finds. */
export function RevealBanner({ data }: { data: RevealData }) {
  const t = TIERS[data.tier];
  const crystal = data.variant === "crystal";
  const cursed = data.variant === "cursed";
  const glitched = data.variant === "glitched";
  return (
    <div className={`reveal${crystal ? " is-crystal" : ""}${cursed ? " is-cursed" : ""}${glitched ? " is-glitched" : ""}`} style={{ "--h": glitched ? 185 : cursed ? 345 : crystal ? 203 : t.hue } as CSSProperties} role="status" aria-live="polite">
      <div className="reveal-card">
        <Block faceClassName="reveal-face">
          <CloverImg tier={data.tier} variant={data.variant} className="reveal-clover" />
          <div className="reveal-copy">
            {data.lucky && <span className="tx-label reveal-lucky"><PixelIcon name="luckyRoll" className="reveal-lucky-icon" /> LUCKY ROLL / x{data.luckyMultiplier.toFixed(2)} LUCK</span>}
            <RarityText tier={data.tier} variant={data.variant} className="reveal-rarity">{variantPrefix(data.variant)}{t.label}</RarityText>
            <span className="tx-stroke reveal-name">{t.name.toUpperCase()}</span>
            <span className="tx-label">{data.crit ? `CRIT x${data.critMultiplier} / 1 IN ${fmtOdds(data.odds)}` : `1 IN ${fmtOdds(data.odds)}`}</span>
            <span className="tx-label reveal-material"><PixelIcon name={materialFor(data.material).icon} className="reveal-material-icon" />+{data.materialAmount} {materialFor(data.material).name}</span>
          </div>
          <Block tone="green" className="reveal-value" faceClassName="reveal-value-face">
            <CloverImg tier={0} size="sm" className="reveal-value-clover" />
            <span className="tx-stroke">+{fmt(data.value)}</span>
          </Block>
        </Block>
        {data.isNew && <Block tone="red" className="reveal-new" faceClassName="reveal-new-face"><span className="tx-stroke">NEW!</span></Block>}
        {glitched && <span className="reveal-glitch-tag" aria-hidden="true">SIGNAL CORRUPTED</span>}
      </div>
    </div>
  );
}
