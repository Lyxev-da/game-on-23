// @ts-nocheck
import { memo, useLayoutEffect, useRef, useState } from "react";
import { TIERS, fmt, fmtOdds, type RollResult } from "../game/data";
import { materialFor } from "../game/materials";
import { CloverImg, RarityText, variantPrefix } from "./ui";

const ROW_HEIGHT = 56;
const WINDOW_SIZE = 10;

/** Scrollable history that only ever renders ~10 rows, however long the list is. */
export const RollHistory = memo(function RollHistory({ feed, compact = false }: { feed: RollResult[]; compact?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const previousHead = useRef<number | null>(null);
  const [start, setStart] = useState(0);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    // keep the user's place if they scrolled down while new rolls arrive
    if (element.scrollTop > 8 && previousHead.current !== null) {
      const offset = feed.findIndex((result) => result.id === previousHead.current);
      if (offset > 0) element.scrollTop += offset * ROW_HEIGHT;
    }
    previousHead.current = feed[0]?.id ?? null;
    setStart(Math.max(0, Math.floor(element.scrollTop / ROW_HEIGHT) - 1));
  }, [feed]);

  return (
    <div
      ref={viewport}
      className="feed-viewport"
      tabIndex={0}
      aria-label="Scrollable recent rolls"
      onScroll={(event) => setStart(Math.max(0, Math.floor(event.currentTarget.scrollTop / ROW_HEIGHT) - 1))}
      style={{ height: compact ? `min(${Math.max(84, feed.length * ROW_HEIGHT)}px, max(120px, calc(100svh - 610px)), 340px)` : `min(${Math.max(84, feed.length * ROW_HEIGHT)}px, 44svh, 400px)` }}
    >
      {feed.length === 0 ? (
        <div className="feed-empty"><span className="tx-label">NO ROLLS YET</span></div>
      ) : (
        <div className="feed-scroll-content" style={{ height: feed.length * ROW_HEIGHT }}>
          {feed.slice(start, start + WINDOW_SIZE).map((result, index) => (
            <div className={`feed-row px${result.variant === "crystal" ? " is-crystal-row" : ""}${result.variant === "cursed" ? " is-cursed-row" : ""}${result.variant === "glitched" ? " is-glitched-row" : ""}${result.lucky ? " is-lucky-row" : ""}`} key={result.id} style={{ top: (start + index) * ROW_HEIGHT }}>
              <CloverImg tier={result.tier} variant={result.variant} size="sm" sparkles={false} effects={false} className="feed-clover" />
              <span className="feed-copy">
                <RarityText tier={result.tier} variant={result.variant} className="feed-name">{variantPrefix(result.variant)}{TIERS[result.tier].name}</RarityText>
                <span className="tx-label" title={`1 in ${fmtOdds(result.odds ?? 1)}`}>
                  {result.lucky ? `LUCKY x${result.luckyMultiplier.toFixed(2)} / ` : ""}{result.crit ? `CRIT x${result.critMultiplier} / ` : ""}1 IN {fmtOdds(result.odds ?? 1)} / +{result.materialAmount} {materialFor(result.material).name}{result.isNew ? " / NEW" : ""}
                </span>
              </span>
              <span className={`tx-stroke feed-value${result.crit ? " is-crit" : ""}`}>+{fmt(result.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
