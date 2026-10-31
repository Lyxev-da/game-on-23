// @ts-nocheck
import { memo, useMemo, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import { getCloverUrl } from "../clover";
import { RARITIES, TIERS, type Variant } from "../game/data";
import { getPixelIconUrl, type IconName } from "../game/icons";

export type { IconName } from "../game/icons";
export type Tone = "metal" | "green" | "red" | "gold" | "dark" | "tint";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** Stepped-corner metal panel: black outline, solid extruded lip, polka-dot face. */
export function Block({ tone = "metal", className, faceClassName, style, children }: {
  tone?: Tone;
  className?: string;
  faceClassName?: string;
  style?: CSSProperties | undefined;
  children?: ReactNode;
}) {
  return (
    <div className={cx("blk", `tone-${tone}`, className)} style={style}>
      <div className="blk-outline px">
        <div className="blk-side px">
          <div className={cx("blk-face px", faceClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Pressable Block: the face sinks into its lip when pressed. */
export function BlockButton({ tone = "metal", className, faceClassName, style, children, off, ...rest }: ComponentPropsWithRef<"button"> & {
  tone?: Tone;
  faceClassName?: string;
  off?: boolean;
}) {
  return (
    <button type="button" className={cx("blk blk-btn", `tone-${tone}`, off && "is-off", className)} style={style} {...rest}>
      <span className="blk-outline px">
        <span className="blk-side px">
          <span className={cx("blk-face px", faceClassName)}>{children}</span>
        </span>
      </span>
    </button>
  );
}

/** 20x20 native pixel sprite. Size it with CSS in multiples of 20px. */
export const PixelIcon = memo(function PixelIcon({ name, className, muted = false, stamp, tint }: {
  name: IconName;
  className?: string;
  muted?: boolean;
  /** Pixel text burned into the icon's lower plate, e.g. "x50". */
  stamp?: string;
  /** Rarity id whose lettering colours the icon, e.g. "aurora". */
  tint?: string;
}) {
  const src = useMemo(() => getPixelIconUrl(name, muted, stamp, tint), [name, muted, stamp, tint]);
  return <img className={cx("pixel-icon", className)} src={src} alt="" aria-hidden="true" width={20} height={20} draggable={false} />;
});

/** Compact icon + value used beside the restored worded descriptions. */
export function IconMetric({ icon, value, className, muted = false, title }: {
  icon: IconName; value: ReactNode; className?: string; muted?: boolean; title?: string;
}) {
  return <span className={cx("icon-metric", className)} aria-label={title}><PixelIcon name={icon} muted={muted} className="icon-metric-icon" /><span className="tx-stroke icon-metric-value">{value}</span></span>;
}

export type CloverSize = "lg" | "md" | "sm";

export const CloverImg = memo(function CloverImg({ tier, variant = "normal", size = "md", className, style, locked = false, sparkles = true, animated = false, effects = true }: {
  tier: number;
  variant?: Variant;
  size?: CloverSize;
  className?: string;
  style?: CSSProperties;
  locked?: boolean;
  sparkles?: boolean;
  animated?: boolean;
  effects?: boolean;
}) {
  const t = TIERS[tier];
  const crystal = variant === "crystal";
  const cursed = variant === "cursed";
  const glitched = variant === "glitched";
  const shiny = variant === "shiny";
  // Every context shares one cached sprite, including the particle canvas.
  const src = useMemo(() => getCloverUrl(crystal || cursed || glitched ? `${t.id}:${variant}` : t.id, t, 8), [t, crystal, cursed, glitched, variant]);
  const pixelSparks = animated && effects && !locked && tier >= 2 && size !== "sm";
  const glints = shiny && !locked && sparkles && size !== "sm";
  const shards = crystal && !locked && sparkles && size !== "sm";
  const aura = cursed && !locked && sparkles && size !== "sm";
  return (
    <span
      className={cx("clover-img", `clover-${t.id}`, shiny && !locked && "is-shiny", crystal && !locked && "is-crystal", cursed && !locked && "is-cursed", glitched && !locked && "is-glitched", locked && "is-locked", animated && "is-animated", className)}
      style={{ ...style, "--spark": glitched ? "#6efbea" : crystal ? "#dff8ff" : cursed ? "#ff4d6d" : t.rainbow ? "#ffffff" : t.color } as CSSProperties}
    >
      {shards && <i className="crystal-glow" aria-hidden="true" />}
      {aura && <i className="cursed-glow" aria-hidden="true" />}
      {glitched && !locked && sparkles && size !== "sm" && <i className="glitch-glow" aria-hidden="true" />}
      <img src={src} alt="" aria-hidden="true" width={229} height={229} draggable={false} />
      {glints && (
        <>
          <i className="glint glint-a" aria-hidden="true" />
          <i className="glint glint-b" aria-hidden="true" />
        </>
      )}
      {shards && (
        <>
          <i className="shard shard-a" aria-hidden="true" />
          <i className="shard shard-b" aria-hidden="true" />
          <i className="shard shard-c" aria-hidden="true" />
          <i className="shard shard-d" aria-hidden="true" />
          <i className="crystal-sheen" aria-hidden="true" />
        </>
      )}
      {aura && (
        <>
          <i className="mote mote-a" aria-hidden="true" />
          <i className="mote mote-b" aria-hidden="true" />
          <i className="mote mote-c" aria-hidden="true" />
          <i className="mote mote-d" aria-hidden="true" />
        </>
      )}
      {glitched && !locked && size !== "sm" && (
        <>
          <img className="glitch-slice glitch-slice-a" src={src} alt="" aria-hidden="true" draggable={false} />
          <img className="glitch-slice glitch-slice-b" src={src} alt="" aria-hidden="true" draggable={false} />
          <i className="glitch-scan" aria-hidden="true" />
        </>
      )}
      {pixelSparks && !crystal && !cursed && !glitched && (
        <>
          <i className="pxspark pxs-a" aria-hidden="true" />
          <i className="pxspark pxs-b" aria-hidden="true" />
          <i className="pxspark pxs-c" aria-hidden="true" />
        </>
      )}
    </span>
  );
});

export const RarityText = memo(function RarityText({ tier, className, children, animated = false, crystal = false, variant }: {
  tier: number;
  className?: string;
  children?: ReactNode;
  animated?: boolean;
  crystal?: boolean;
  variant?: Variant;
}) {
  const t = TIERS[tier];
  const content = children ?? t.label;
  const v = variant ?? (crystal ? "crystal" : "normal");
  const word = v === "glitched" ? "word-glitched" : v === "cursed" ? "word-cursed" : v === "crystal" ? "word-crystal" : `word-${t.rarity}`;
  const color = v === "glitched" ? "#8bffee" : v === "cursed" ? "#ff4d6d" : v === "crystal" ? "#dff8ff" : RARITIES.find((rarity) => rarity.id === t.rarity)!.color;
  return (
    <span className={cx("tx-stroke rarity-text", word, animated && "is-animated", className)} style={{ color }}>
      <span className="rarity-back" aria-hidden="true">{content}</span>
      <span className="rarity-front">{content}</span>
    </span>
  );
});

/** Variant prefixes are shared by the index, banner, statistics and history. */
export const variantPrefix = (variant: Variant) => variant === "glitched" ? "GLITCHED " : variant === "cursed" ? "CURSED " : variant === "crystal" ? "CRYSTAL " : variant === "shiny" ? "SHINY " : "";

export function PxBar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cx("px-bar px", className)}>
      <i className="px" style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
    </span>
  );
}

/** On/off switch with fixed columns: label on the left, state box on the right. */
export function Switch({ on, onToggle, labelOn = "ON", labelOff = "OFF", ariaLabel }: {
  on: boolean;
  onToggle: () => void;
  labelOn?: string;
  labelOff?: string;
  ariaLabel: string;
}) {
  return (
    <BlockButton tone={on ? "green" : "dark"} className="switch" faceClassName="switch-face" onClick={onToggle} role="switch" aria-checked={on} aria-label={ariaLabel}>
      <span className="tx-stroke switch-text">{on ? labelOn : labelOff}</span>
      <span className={cx("switch-indicator px", on && "is-on")} aria-hidden="true">
        <span className="switch-mark">{on ? "+" : "-"}</span>
      </span>
    </BlockButton>
  );
}
