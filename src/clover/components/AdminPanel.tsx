// @ts-nocheck
import { useState, type CSSProperties, type ReactNode } from "react";
import { EVENTS, REBIRTH_MAX, fmt, type Save } from "../game/data";
import {
  completeQuests, discoverAll, endEvent, giveClovers, giveEverything, giveGems, giveMaterials, givePotions, giveTickets,
  maxForever, maxShopUpgrades, resetQuests, setRebirths, startEvent, unlockAllCharms, unlockAuto,
} from "../game/admin";
import { Block, BlockButton, CloverImg, PixelIcon, type IconName } from "./ui";
import { Modal } from "./panels";

type Apply = (label: string, fn: (s: Save) => Save) => void;

const PRESETS: Record<"clovers" | "gems" | "tickets", Array<[string, number]>> = {
  clovers: [["1K", 1e3], ["1M", 1e6], ["1B", 1e9], ["1T", 1e12], ["1Qa", 1e15]],
  gems: [["10", 10], ["100", 100], ["1K", 1e3], ["10K", 1e4], ["1M", 1e6]],
  tickets: [["10", 10], ["100", 100], ["1K", 1e3], ["10K", 1e4], ["1M", 1e6]],
};

function Section({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  return (
    <Block className="adm-sec" faceClassName="adm-sec-face">
      <span className="adm-sec-head"><PixelIcon name={icon} className="adm-sec-icon" /><span className="tx-stroke">{title}</span></span>
      <div className="adm-grid">{children}</div>
    </Block>
  );
}

function Btn({ label, onClick, tone = "metal", wide = false }: { label: string; onClick: () => void; tone?: "metal" | "green" | "gold" | "red" | "dark" | "tint"; wide?: boolean }) {
  return (
    <BlockButton tone={tone} className={`adm-btn${wide ? " is-wide" : ""}`} faceClassName="adm-btn-face" onClick={onClick}>
      <span className="tx-stroke">{label}</span>
    </BlockButton>
  );
}

/** The tester panel: gives, unlocks and triggers anything, in the same blocky style as the game. */
export function AdminPanel({ save, apply, onClose }: { save: Save; apply: Apply; onClose: () => void }) {
  const [amount, setAmount] = useState("1000000");
  const [message, setMessage] = useState("READY");
  const custom = Number(amount.replace(/[,_ ]/g, ""));
  const validAmount = Number.isFinite(custom) && custom > 0;
  const run: Apply = (label, fn) => { apply(label, fn); setMessage(label); };

  const currency = (key: "clovers" | "gems" | "tickets", title: string, value: number, give: (s: Save, n: number) => Save, icon: ReactNode) => (
    <div className="adm-currency">
      <Block tone="dark" className="adm-wallet" faceClassName="adm-wallet-face">
        {icon}
        <span className="adm-wallet-copy"><span className="tx-stroke adm-wallet-value">{fmt(value)}</span><span className="tx-label">{title}</span></span>
      </Block>
      <div className="adm-grid">
        {PRESETS[key].map(([label, n]) => <Btn key={label} label={`+${label}`} tone="green" onClick={() => run(`+${label} ${title}`, (s) => give(s, n))} />)}
        <Btn label="+AMOUNT" tone="gold" onClick={() => validAmount && run(`+${fmt(custom)} ${title}`, (s) => give(s, custom))} />
        <Btn label="ZERO" tone="red" onClick={() => run(`${title} SET TO 0`, (s) => give(s, -Number.MAX_SAFE_INTEGER))} />
      </div>
    </div>
  );

  return (
    <Modal title="ADMIN PANEL" headTone="red" icon="gear" onClose={onClose} className="admin-modal"
      footer={<span className="tx-label">TESTER TOOLS. EVERYTHING HERE CHANGES YOUR REAL SAVE.</span>}>
      <Block tone="dark" className="adm-status" faceClassName="adm-status-face">
        <span className="tx-label">LAST ACTION</span>
        <span className="tx-stroke adm-status-text">{message}</span>
      </Block>

      <Section title="CURRENCY" icon="coin">
        <label className="adm-amount">
          <span className="tx-label">CUSTOM AMOUNT</span>
          <input className="adm-input" inputMode="decimal" spellCheck={false} autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Custom amount" />
        </label>
        <div className="adm-currencies">
          {currency("clovers", "CLOVERS", save.clovers, giveClovers, <CloverImg tier={0} size="sm" className="adm-wallet-icon" />)}
          {currency("gems", "CLOVER GEMS", save.cloverGems, giveGems, <PixelIcon name="cloverGem" className="adm-wallet-icon" />)}
          {currency("tickets", "TICKETS", save.tickets, giveTickets, <PixelIcon name="ticket" className="adm-wallet-icon" />)}
        </div>
      </Section>

      <Section title={`REBIRTHS (${save.rebirths}/${REBIRTH_MAX})`} icon="rebirth">
        <Btn label="-1" tone="red" onClick={() => run("REBIRTHS -1", (s) => setRebirths(s, s.rebirths - 1))} />
        <Btn label="+1" tone="green" onClick={() => run("REBIRTHS +1", (s) => setRebirths(s, s.rebirths + 1))} />
        <Btn label="+5" tone="green" onClick={() => run("REBIRTHS +5", (s) => setRebirths(s, s.rebirths + 5))} />
        <Btn label="+15" tone="green" onClick={() => run("REBIRTHS +15", (s) => setRebirths(s, s.rebirths + 15))} />
        <Btn label="MAX" tone="gold" onClick={() => run("REBIRTHS MAXED", (s) => setRebirths(s, REBIRTH_MAX))} />
        <Btn label="ZERO" tone="red" onClick={() => run("REBIRTHS SET TO 0", (s) => setRebirths(s, 0))} />
      </Section>

      <Section title="UNLOCK" icon="forge">
        <Btn label="ALL CHARMS" onClick={() => run("ALL CHARMS OWNED", unlockAllCharms)} />
        <Btn label="99 POTIONS" onClick={() => run("99 OF EVERY POTION", (s) => givePotions(s, 99))} />
        <Btn label="+1K MATERIALS" onClick={() => run("+1K OF EVERY MATERIAL", (s) => giveMaterials(s, 1000))} />
        <Btn label="+1M MATERIALS" onClick={() => run("+1M OF EVERY MATERIAL", (s) => giveMaterials(s, 1e6))} />
        <Btn label="MAX SHOP" onClick={() => run("SHOP UPGRADES MAXED", maxShopUpgrades)} />
        <Btn label="MAX FOREVER" onClick={() => run("FOREVER UPGRADES MAXED", maxForever)} />
        <Btn label="DISCOVER ALL" onClick={() => run("EVERY CLOVER DISCOVERED", discoverAll)} />
        <Btn label="UNLOCK AUTO" onClick={() => run("AUTO ROLL UNLOCKED", unlockAuto)} />
      </Section>

      <Section title="QUESTS" icon="quests">
        <Btn label="COMPLETE ALL" tone="green" onClick={() => run("ALL QUESTS COMPLETE", completeQuests)} />
        <Btn label="NEW QUESTS" tone="tint" onClick={() => run("NEW QUESTS ROLLED", resetQuests)} />
      </Section>

      <Section title="WORLD EVENTS" icon="star">
        {EVENTS.map((event) => <Btn key={event.id} label={event.name} tone="gold" onClick={() => run(`${event.name} STARTED`, (s) => startEvent(s, event.id))} />)}
        <Btn label="END EVENT" tone="red" onClick={() => run("EVENT ENDED", endEvent)} />
      </Section>

      <BlockButton tone="gold" className="adm-everything" faceClassName="adm-everything-face" style={{ "--h": 45 } as CSSProperties} onClick={() => run("EVERYTHING GRANTED", giveEverything)}>
        <PixelIcon name="crown" className="adm-everything-icon" />
        <span className="tx-stroke">GIVE EVERYTHING</span>
      </BlockButton>
    </Modal>
  );
}
