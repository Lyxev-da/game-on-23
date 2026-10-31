// @ts-nocheck
import { useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { fmt, type Save } from "../game/data";
import { CLOVER_PACKS, luckDoublerCost, luckDoublerMaxed, luckDoublerMultiplier, type CloverPack, type CloverPackId } from "../game/ticketPacks";
import { sfx } from "../game/sound";
import { Block, BlockButton, CloverImg, PixelIcon } from "./ui";
import { TicketBurst, type Burst } from "./Quests";

/** The art grows from one clover into a pile, a sack and a full chest. */
const PILE: Array<Array<[number, number, number]>> = [
  [[50, 54, 84]],
  [[31, 57, 62], [69, 47, 62]],
  [[23, 58, 48], [50, 44, 52], [77, 58, 48], [37, 70, 44], [63, 70, 44]],
  [[20, 54, 42], [39, 43, 44], [61, 43, 44], [80, 54, 42], [30, 68, 42], [50, 63, 46], [70, 68, 42]],
];
function CloverPackArt({ index }: { index: number }) {
  if (index === 4 || index === 5) {
    return <span className="pack-sprite"><PixelIcon name={index === 4 ? "cloverSack" : "cloverChest"} /></span>;
  }
  return (
    <span className={`pack-art pack-art-${index}`} aria-hidden="true">
      {PILE[index].map(([x, y, size], i) => (
        <CloverImg key={i} tier={0} size="sm" sparkles={false} effects={false} className="ticket-pack-clover"
          style={{ "--x": `${x}%`, "--y": `${y}%`, "--size": `${size}px` } as CSSProperties} />
      ))}
    </span>
  );
}

/** Six repeatable clover packs, laid out as a bright, illustrated 3x2 shop. */
export function TicketStore({ save, onBuy, onBuyLuck }: { save: Save; onBuy: (id: CloverPackId) => boolean; onBuyLuck: () => boolean }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [shaking, setShaking] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; pack: string; x: number; y: number }>>([]);

  const buy = (pack: CloverPack, event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const rippleId = Date.now() + Math.random();
    setRipples((current) => [...current, { id: rippleId, pack: pack.id, x: event.clientX - rect.left, y: event.clientY - rect.top }]);
    window.setTimeout(() => setRipples((current) => current.filter((r) => r.id !== rippleId)), 620);
    if (save.tickets < pack.tickets) {
      sfx.deny(); setShaking(pack.id); window.setTimeout(() => setShaking(null), 480); return;
    }
    if (!onBuy(pack.id)) { sfx.deny(); return; }
    sfx.buy();
    const target = document.querySelector("[data-ticket-target]")?.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const id = Date.now() + Math.random();
    const burst: Burst = { id, x, y, tx: target ? target.left + target.width / 2 - x : 0, ty: target ? target.top + target.height / 2 - y : -220, count: 16 };
    setBursts((current) => [...current, burst]);
    window.setTimeout(() => setBursts((current) => current.filter((b) => b.id !== id)), 1600);
  };

  const fmtMult = (n: number) => `x${n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n}`;
  const level = Math.floor(save.luckDoubler || 0);
  const maxed = luckDoublerMaxed(level);
  const current = luckDoublerMultiplier(level);
  const next = luckDoublerMultiplier(level + 1);
  const luckCost = luckDoublerCost(level);
  const canDouble = !maxed && save.tickets >= luckCost;
  const [luckPop, setLuckPop] = useState(0);

  const buyLuck = (event: MouseEvent<HTMLElement>) => {
    if (maxed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (save.tickets < luckCost) { sfx.deny(); setShaking("luck"); window.setTimeout(() => setShaking(null), 480); return; }
    if (!onBuyLuck()) { sfx.deny(); return; }
    sfx.buy();
    setLuckPop((n) => n + 1);
    const target = document.querySelector("[data-ticket-target]")?.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const id = Date.now() + Math.random();
    setBursts((c) => [...c, { id, x, y, tx: target ? target.left + target.width / 2 - x : 0, ty: target ? target.top + target.height / 2 - y : -220, count: 14 }]);
    window.setTimeout(() => setBursts((c) => c.filter((b) => b.id !== id)), 1600);
  };

  return (
    <div className="ticket-store" role="tabpanel" aria-label="Clover packs">
      <Block className={`luck-banner${shaking === "luck" ? " is-shake" : ""}${maxed ? " is-maxed" : ""}`} faceClassName="luck-banner-face" style={{ "--i": 0 } as CSSProperties}>
        <span className="luck-banner-bag" aria-hidden="true"><PixelIcon name="cloverSack" /></span>
        <span className="luck-banner-copy">
          <span className="luck-banner-title"><b>DOUBLE</b> Your <i>LUCK</i></span>
          <span key={luckPop} className="luck-banner-mults">
            <span className="tx-stroke luck-mult-now">{fmtMult(current)}</span>
            {!maxed && <><i className="luck-arrow" aria-hidden="true" /><span className="tx-stroke luck-mult-next">{fmtMult(next)}</span></>}
          </span>
        </span>
        <BlockButton tone="green" className={`ticket-pack-price luck-banner-price${canDouble ? " can-buy" : ""}`} faceClassName="ticket-pack-price-face" onClick={buyLuck} disabled={maxed}
          aria-label={maxed ? "Luck doubler maxed" : `Double your luck to ${fmtMult(next)} for ${luckCost} tickets`}>
          {maxed ? <span className="tx-stroke">MAX</span> : <><PixelIcon name="ticket" className="ticket-pack-ticket" /><span className="tx-stroke">{luckCost.toLocaleString("en-US")}</span></>}
        </BlockButton>
      </Block>
      {CLOVER_PACKS.map((pack, index) => (
        <Block key={pack.id} className={`ticket-pack${shaking === pack.id ? " is-shake" : ""}`} faceClassName="ticket-pack-face" style={{ "--i": index + 1, "--h": [131, 162, 197, 269, 330, 42][index] } as CSSProperties}>
          {ripples.filter((r) => r.pack === pack.id).map((r) => <i key={r.id} className="ticket-pack-ripple" style={{ left: r.x, top: r.y } as CSSProperties} aria-hidden="true" />)}
          <CloverPackArt index={index} />
          <span className="tx-stroke ticket-pack-amount">+{fmt(pack.amount)} CLOVERS</span>
          <BlockButton tone="green" className={`ticket-pack-price${save.tickets >= pack.tickets ? " can-buy" : ""}`} faceClassName="ticket-pack-price-face" onClick={(event) => buy(pack, event)} aria-label={`Buy ${fmt(pack.amount)} clovers for ${fmt(pack.tickets)} tickets`}>
            <PixelIcon name="ticket" className="ticket-pack-ticket" /><span className="tx-stroke">{pack.tickets.toLocaleString("en-US")}</span>
          </BlockButton>
        </Block>
      ))}
      {createPortal(<>{bursts.map((burst) => <TicketBurst key={burst.id} burst={burst} />)}</>, document.body)}
    </div>
  );
}
