// @ts-nocheck
import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { fmt, type Save } from "../game/data";
import {
  BONUS_TICKETS, QUEST_INFO, bonusReady, claimableCount, describeQuest, isDone, msUntilDayReset, msUntilWeekReset, questsDone,
  type QuestScope,
} from "../game/quests";
import { Block, BlockButton, PixelIcon, PxBar } from "./ui";
import { Modal } from "./panels";

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(total / 86400), h = Math.floor((total % 86400) / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  if (d > 0) return `${d}D ${h}H`;
  return h > 0 ? `${h}H ${String(m).padStart(2, "0")}M` : `${m}:${String(s).padStart(2, "0")}`;
};

export type Burst = { id: number; x: number; y: number; tx: number; ty: number; count: number };

/** Tickets pop out of a button in a fan, then swoop to a target (the wallet). */
export function TicketBurst({ burst }: { burst: Burst }) {
  const pieces = useMemo(() => Array.from({ length: burst.count }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
    const dist = 70 + Math.random() * 120;
    return {
      dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 20,
      rot: (Math.random() - 0.5) * 540, delay: i * 22, size: 26 + Math.random() * 12,
    };
  }), [burst.count]);
  return (
    <div className="ticket-burst" aria-hidden="true" style={{ left: burst.x, top: burst.y } as CSSProperties}>
      <i className="burst-ring" />
      {pieces.map((p, i) => (
        <span key={i} className="burst-piece" style={{
          "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--tx": `${burst.tx}px`, "--ty": `${burst.ty}px`,
          "--rot": `${p.rot}deg`, "--delay": `${p.delay}ms`, "--size": `${p.size}px`,
        } as CSSProperties}>
          <PixelIcon name="ticket" className="burst-ticket" />
        </span>
      ))}
    </div>
  );
}

export function QuestsModal({ save, onClaim, onClaimBonus, onClaimAll, onOpenCloverShop, onClose }: {
  save: Save;
  onClaim: (scope: QuestScope, index: number) => number | null;
  onClaimBonus: (scope: QuestScope) => number | null;
  onClaimAll: () => number | null;
  onOpenCloverShop: () => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<QuestScope>("daily");
  const [now, setNow] = useState(Date.now);
  const [bursts, setBursts] = useState<Burst[]>([]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const state = save.quests;
  const list = state?.[scope] ?? [];
  const ready = claimableCount(save);

  /** Fires the burst from the pressed button toward the ticket wallet. */
  const burstFrom = (event: MouseEvent<HTMLElement>, tickets: number | null) => {
    if (!tickets) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const target = document.querySelector("[data-ticket-target]")?.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const id = Date.now() + Math.random();
    const burst: Burst = {
      id, x, y,
      tx: target ? target.left + target.width / 2 - x : 0,
      ty: target ? target.top + target.height / 2 - y : -200,
      count: Math.min(20, 7 + tickets),
    };
    setBursts((current) => [...current, burst]);
    window.setTimeout(() => setBursts((current) => current.filter((b) => b.id !== id)), 1500);
  };

  const bonus = BONUS_TICKETS[scope];
  const bonusClaimed = scope === "daily" ? state?.dailyBonus : state?.weeklyBonus;
  const bonusOpen = bonusReady(save, scope);

  return (
    <Modal title="QUESTS" headTone="gold" icon="quests" onClose={onClose} className="quests-modal"
      footer={<span className="tx-label">DAILY QUESTS RESET AT MIDNIGHT. WEEKLY QUESTS RESET EVERY MONDAY. TICKETS BUY CLOVER PACKS IN THE SHOP.</span>}>
      <div className="q-top">
        <Block tone="dark" className="q-wallet" faceClassName="q-wallet-face">
          <span data-ticket-target className="q-wallet-icon"><PixelIcon name="ticket" /></span>
          <span className="q-wallet-copy">
            <span key={save.tickets} className="tx-stroke q-wallet-value">{fmt(save.tickets)}</span>
            <span className="tx-label">TICKETS</span>
          </span>
        </Block>
        <div className="q-actions">
          <BlockButton tone={ready ? "gold" : "metal"} disabled={!ready} className={`q-claim-all${ready ? " is-ready" : ""}`} faceClassName="q-claim-all-face" onClick={(e) => burstFrom(e, onClaimAll())}>
            <PixelIcon name="ticket" className="q-btn-icon" />
            <span className="tx-stroke">{ready ? `CLAIM ALL ${ready}` : "NOTHING TO CLAIM"}</span>
          </BlockButton>
          <BlockButton tone="tint" style={{ "--h": 330 } as CSSProperties} className="q-spend" faceClassName="q-claim-all-face" onClick={onOpenCloverShop}>
            <PixelIcon name="cloverSack" className="q-btn-icon" />
            <span className="tx-stroke">CLOVER SHOP</span>
          </BlockButton>
        </div>
      </div>

      <div className="cl-tabs" role="tablist" aria-label="Quest sets">
        {(["daily", "weekly"] as const).map((key) => (
          <BlockButton key={key} role="tab" aria-selected={scope === key} tone={scope === key ? (key === "daily" ? "green" : "tint") : "metal"}
            style={key === "weekly" ? ({ "--h": 272 } as CSSProperties) : undefined} className="cl-tab" faceClassName="cl-tab-face" onClick={() => setScope(key)}>
            <PixelIcon name={key === "daily" ? "calendar" : "book"} className="cl-tab-icon" />
            <span className="tx-stroke cl-tab-name">{key === "daily" ? "DAILY" : "WEEKLY"}</span>
            <span className="tx-label">{questsDone(save, key)}/6 DONE / RESETS IN {clock(key === "daily" ? msUntilDayReset(now) : msUntilWeekReset(now))}</span>
          </BlockButton>
        ))}
      </div>

      <div className="shop-list" role="tabpanel" aria-label={`${scope} quests`} key={scope}>
        {list.map((quest, index) => {
          const info = QUEST_INFO[quest.kind];
          const done = isDone(quest);
          return (
            <Block key={`${scope}-${index}`} className={`shop-row quest-row${done && !quest.claimed ? " is-ready" : ""}${quest.claimed ? " is-claimed" : ""}`}
              faceClassName="shop-row-face" style={{ "--i": index } as CSSProperties}>
              <Block tone="dark" className="icon-well" faceClassName="icon-well-face"><PixelIcon name={info.icon} /></Block>
              <div className="shop-info">
                <span className="tx-stroke shop-name">{info.title}</span>
                <span className="tx-label shop-blurb">{describeQuest(quest, fmt)}</span>
                <span className="shop-level quest-progress"><PxBar value={quest.progress / quest.target} /><span className="tx-label">{fmt(quest.progress)}/{fmt(quest.target)}</span></span>
              </div>
              <div className="buy-controls">
                {quest.claimed ? (
                  <Block tone="gold" className="buy-btn" faceClassName="buy-face"><span className="tx-stroke">CLAIMED</span></Block>
                ) : done ? (
                  <>
                    <BlockButton tone="green" className="buy-btn claim-btn" faceClassName="buy-face" onClick={(e) => burstFrom(e, onClaim(scope, index))} aria-label={`Claim ${quest.reward} tickets`}>
                      <PixelIcon name="ticket" className="buy-clover" />
                      <span className="tx-stroke">CLAIM</span>
                    </BlockButton>
                    <Block tone="dark" className="max-btn" faceClassName="max-face"><span className="tx-label">+{quest.reward} TICKETS</span></Block>
                  </>
                ) : (
                  <>
                    <Block tone="dark" className="buy-btn" faceClassName="buy-face"><PixelIcon name="ticket" className="buy-clover" /><span className="tx-stroke">+{quest.reward}</span></Block>
                    <Block tone="dark" className="max-btn" faceClassName="max-face"><span className="tx-label">IN PROGRESS</span></Block>
                  </>
                )}
              </div>
            </Block>
          );
        })}

        <Block tone={bonusClaimed ? "gold" : "dark"} className={`shop-row quest-row quest-bonus${bonusOpen ? " is-ready" : ""}${bonusClaimed ? " is-claimed" : ""}`}
          faceClassName="shop-row-face" style={{ "--i": 6 } as CSSProperties}>
          <Block tone="dark" className="icon-well" faceClassName="icon-well-face"><PixelIcon name="chest" /></Block>
          <div className="shop-info">
            <span className="tx-stroke shop-name">{scope === "daily" ? "DAILY BONUS" : "WEEKLY BONUS"}</span>
            <span className="tx-label shop-blurb">CLAIM ALL SIX {scope.toUpperCase()} QUESTS TO OPEN THE BONUS CHEST</span>
            <span className="shop-level quest-progress"><PxBar value={list.filter((q) => q.claimed).length / 6} /><span className="tx-label">{list.filter((q) => q.claimed).length}/6 CLAIMED</span></span>
          </div>
          <div className="buy-controls">
            {bonusClaimed ? (
              <Block tone="gold" className="buy-btn" faceClassName="buy-face"><span className="tx-stroke">CLAIMED</span></Block>
            ) : bonusOpen ? (
              <BlockButton tone="gold" className="buy-btn claim-btn" faceClassName="buy-face" onClick={(e) => burstFrom(e, onClaimBonus(scope))}>
                <PixelIcon name="ticket" className="buy-clover" /><span className="tx-stroke">+{bonus}</span>
              </BlockButton>
            ) : (
              <Block tone="dark" className="buy-btn" faceClassName="buy-face"><PixelIcon name="lock" className="buy-lock-icon" /><span className="tx-stroke">+{bonus}</span></Block>
            )}
          </div>
        </Block>
      </div>

      {createPortal(<>{bursts.map((burst) => <TicketBurst key={burst.id} burst={burst} />)}</>, document.body)}
    </Modal>
  );
}
