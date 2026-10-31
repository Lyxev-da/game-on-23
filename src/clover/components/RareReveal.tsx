// @ts-nocheck
import { useEffect, useRef, type CSSProperties } from "react";
import { TIERS, fmt, fmtOdds, type RollResult } from "../game/data";
import { materialFor } from "../game/materials";
import { Block, CloverImg, PixelIcon, RarityText, variantPrefix } from "./ui";

export type RevealLevel = 0 | 1 | 2 | 3;

/**
 * How big a moment a roll deserves. The rarer it is, the longer and louder the
 * reveal, so a 1-in-30,000 find never feels like a 1-in-4 one.
 */
export function revealLevel(r: Pick<RollResult, "tier" | "variant" | "odds" | "isNew">): RevealLevel {
  const chance = TIERS[r.tier].chance;
  if (r.variant === "glitched" || r.odds >= 25000) return 3;
  if (r.variant === "cursed" || r.odds >= 2500) return 2;
  if (r.variant === "crystal" || r.odds >= 300 || (r.isNew && chance >= 60)) return 1;
  return 0;
}

/** Extra reel time spent crawling toward the marker before a rare result lands. */
export const SUSPENSE_MS: Record<RevealLevel, number> = { 0: 0, 1: 650, 2: 1150, 3: 1750 };
/** How long a reveal holds before it dismisses itself. */
export const REVEAL_HOLD_MS: Record<RevealLevel, number> = { 0: 0, 1: 3000, 2: 4200, 3: 6000 };
/** Input is ignored this long, so mashing Space can't skip the moment by accident. */
export const REVEAL_LOCK_MS = 700;

const KICKER: Record<RevealLevel, string> = { 0: "", 1: "RARE FIND", 2: "INCREDIBLE FIND", 3: "ONE IN A MILLION" };

/** Payout that counts up instead of just appearing. */
function CountUp({ value, delay, animated }: { value: number; delay: number; animated: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !animated) return;
    let frame = 0;
    let start = 0;
    el.textContent = "+0";
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / 900));
      el.textContent = `+${fmt(Math.floor(value * (1 - (1 - t) ** 3)))}`;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay, animated]);
  return <span ref={ref} className="tx-stroke">+{fmt(value)}</span>;
}

export function RareReveal({ result, level, effects, onDismiss }: { result: RollResult; level: RevealLevel; effects: boolean; onDismiss: () => void }) {
  const t = TIERS[result.tier];
  const variant = result.variant;
  const hue = variant === "glitched" ? 185 : variant === "cursed" ? 345 : variant === "crystal" ? 203 : t.rainbow ? 300 : t.hue;
  const material = materialFor(result.material);
  const kicker = result.isNew ? "NEW DISCOVERY" : KICKER[level];

  return (
    <div
      className={`rr rr-lvl-${level} rr-${variant}${t.rainbow ? " is-rainbow" : ""}${effects ? " is-fx" : ""}`}
      style={{ "--h": hue } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={`${kicker}: ${variantPrefix(variant)}${t.name}, 1 in ${fmtOdds(result.odds)}`}
      onClick={onDismiss}
    >
      <i className="rr-backdrop" aria-hidden="true" />
      {effects && <i className="rr-rays" aria-hidden="true" />}
      {effects && level >= 3 && <i className="rr-flash" aria-hidden="true" />}
      <div className="rr-stage">
        <span className="tx-stroke rr-kicker">{kicker}</span>
        <div className="rr-clover">
          <i className="rr-halo" aria-hidden="true" />
          <CloverImg tier={result.tier} variant={variant} size="lg" animated={effects} effects={effects} className="rr-clover-img" />
        </div>
        <RarityText tier={result.tier} variant={variant} animated={effects} className="rr-rarity">{variantPrefix(variant)}{t.label}</RarityText>
        <span className="tx-stroke rr-name">{t.name.toUpperCase()}</span>
        <span className="tx-stroke rr-odds">1 IN {fmtOdds(result.odds)}</span>
        <div className="rr-rewards">
          <Block tone="green" className="rr-value" faceClassName="rr-value-face">
            <CloverImg tier={0} size="sm" className="rr-value-clover" />
            <CountUp value={result.value} delay={520} animated={effects} />
          </Block>
          {result.crit && <Block tone="gold" className="rr-tag" faceClassName="rr-tag-face"><span className="tx-stroke">CRIT x{result.critMultiplier}</span></Block>}
          {result.lucky && <Block tone="gold" className="rr-tag" faceClassName="rr-tag-face"><PixelIcon name="luckyRoll" className="rr-tag-icon" /><span className="tx-stroke">LUCKY</span></Block>}
        </div>
        <span className="tx-label rr-material"><PixelIcon name={material.icon} className="rr-material-icon" />+{result.materialAmount} {material.name}</span>
        <span className="tx-label rr-hint">CLICK OR PRESS SPACE TO CONTINUE</span>
      </div>
    </div>
  );
}
