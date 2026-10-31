// @ts-nocheck
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { warmCloverSprites } from "./clover";
import {
  AUTO_UNLOCK_ROLLS, TIERS, TOTAL_ENTRIES, UPGRADES, autoInterval, autoUnlocked, canRebirth, luckyInterval, luckyMultiplier, rollsUntilLucky,
  clearSave, crystalUnlocked, cursedUnlocked, glitchedUnlocked, discoveredCount, doRebirth, fmt, getLuck, newSave,
  rebirthCost, rollOnce, ROLL_DURATION, tierProbabilities, drawTier, getVariantChances, purchaseUpgrade, purchaseForever, purchaseCloverPack, purchaseLuckDoubler, sampleVariant, upgradeUnlocked,
  addLifetime, activeEvent, maybeStartEvent,
  type RollResult, type UpgradeId,
} from "./game/data";
import { FOREVER, foreverLevel, type ForeverId } from "./game/gems";
import { useGameSession } from "./game/useGameSession";
import { CHARMS, canCraftCharm, craftCharm, toggleCharm, type CharmId } from "./game/charms";
import { POTIONS, activePotion, breweryUnlocked, brewPotion, canBrewPotion, drinkPotion, expirePotion, potionFor, potionTime, type PotionId } from "./game/potions";
import { sfx } from "./game/sound";
import { Block, BlockButton, CloverImg, PixelIcon, variantPrefix } from "./components/ui";
import { IndexModal, Modal, OfflineModal, RebirthModal, RevealBanner, SettingsModal, ShopModal, type RevealData } from "./components/panels";
import { CharmForge } from "./components/CharmForge";
import { ParticleCanvas, type ParticleHandle } from "./components/ParticleCanvas";
import { RollHistory } from "./components/RollHistory";
import { GoalPanel } from "./components/GoalPanel";
import { RareReveal, REVEAL_HOLD_MS, REVEAL_LOCK_MS, SUSPENSE_MS, revealLevel, type RevealLevel } from "./components/RareReveal";
import { claimAll, claimBonus, claimQuest, claimableCount, describeQuest, ensureQuests, trackQuests } from "./game/quests";
import { QuestsModal } from "./components/Quests";
import { AdminPanel } from "./components/AdminPanel";
import type { CloverPackId } from "./game/ticketPacks";

type ModalName = "shop" | "index" | "forge" | "settings" | "history" | "rebirth" | "offline" | "quests" | "admin";
/** Hot-pink hue shared by the rebirth icon and every rebirth panel/button. */
const REBIRTH_HUE = 330;
const FEED_LIMIT = 60;
/** The rarity rail: 36 cells scroll past the marker; the real result sits at cell 30. */
const SPIN_ITEMS = 36;
const SPIN_TARGET = 30;
/** The reel stops this early, leaving a beat for the landing flash before the reveal. */
const SPIN_SETTLE = 420;
type SpinState = { key: number; active: boolean; lucky: boolean; luckyMultiplier: number; items: Array<{ tier: number; variant: RollResult["variant"] }>; jitter: number; hue: number; duration: number; suspense: boolean };

const makeRestingSpin = (tier = 0, variant: RollResult["variant"] = "normal"): SpinState => ({
  key: 0,
  active: false,
  lucky: false,
  luckyMultiplier: 1,
  items: Array.from({ length: SPIN_ITEMS }, (_, i) => ({
    tier: i === SPIN_TARGET ? tier : i % 4 === 0 ? 1 : 0,
    variant: i === SPIN_TARGET ? variant : "normal",
  })),
  jitter: 0,
  hue: TIERS[tier]?.hue ?? 131,
  duration: ROLL_DURATION,
  suspense: false,
});

type Toast = { id: number; title: string; text: string; hue: number; icon: string };
const KEY_MODALS: Record<string, ModalName> = { KeyS: "shop", KeyC: "index", KeyF: "forge", KeyR: "rebirth", KeyL: "history", KeyQ: "quests" };
const KEY_LEGEND: Array<[string, string]> = [["SPACE", "ROLL"], ["A", "AUTO"], ["S", "SHOP"], ["C", "CLOVERS"], ["F", "FORGE"], ["Q", "QUESTS"], ["R", "REBIRTH"], ["ESC", "CLOSE"]];

export default function App() {
  const { save, saveRef, commit, ownerRef, status, storageEnabled, saveError, persistNow, claimOffline, retrySession } = useGameSession();
  const worldRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const particleRef = useRef<ParticleHandle>(null);
  const pointerBounds = useRef<DOMRect | null>(null);
  const ids = useRef(0);
  const [lastRoll, setLastRoll] = useState<{ tier: number; variant: RollResult["variant"] }>({ tier: 0, variant: "normal" });
  const [spin, setSpin] = useState<SpinState>(() => makeRestingSpin());
  const spinTimer = useRef<number | undefined>(undefined);
  const spinEndAt = useRef(0);
  const spinKey = useRef(0);
  const burstTimer = useRef<number | undefined>(undefined);
  const shownOfflineReceipt = useRef<string | null>(null);
  const [offlineClaimError, setOfflineClaimError] = useState(false);
  const readyAt = useRef(0);
  const autoReadyAt = useRef(0);
  const cooldownTimer = useRef<number | undefined>(undefined);
  const bannerTimer = useRef<number | undefined>(undefined);
  const glyphAnimation = useRef<Animation | null>(null);
  const [cooldown, setCooldown] = useState({ active: false, duration: ROLL_DURATION, token: 0 });
  const [feed, setFeed] = useState<RollResult[]>([]);
  const [banner, setBanner] = useState<RevealData | null>(null);
  const [glitchFlash, setGlitchFlash] = useState(0);
  const flashTimer = useRef<number | undefined>(undefined);
  const [modal, setModal] = useState<ModalName | null>(null);
  const modalRef = useRef<ModalName | null>(null);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [potionClock, setPotionClock] = useState(Date.now);
  const [forgeView, setForgeView] = useState<"charms" | "brewery">("charms");
  const [shopView, setShopView] = useState<"upgrades" | "tickets">("upgrades");
  const [cinematic, setCinematic] = useState<{ result: RollResult; level: RevealLevel } | null>(null);
  const cinematicRef = useRef<{ at: number } | null>(null);
  const cinematicTimer = useRef<number | undefined>(undefined);
  const suspenseTimer = useRef<number | undefined>(undefined);
  const [suspense, setSuspense] = useState<RevealLevel>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600);
  }, []);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const effects = !save.performance && !reducedMotion;
  const effectsRef = useRef(effects);
  effectsRef.current = effects;
  const livePotion = activePotion(save, potionClock);
  const livePotionRecipe = livePotion && potionFor(livePotion.id);
  const luck = getLuck(save, potionClock);
  const found = discoveredCount(save);
  const shownTier = TIERS[lastRoll.tier];
  const shownCrystal = lastRoll.variant === "crystal";
  const shownCursed = lastRoll.variant === "cursed";
  const shownGlitched = lastRoll.variant === "glitched";
  const sessionBlocked = status !== "active";
  const uiBlocked = !!modal || sessionBlocked;
  const unlockedAuto = autoUnlocked(save);
  const claimable = claimableCount(save);
  const canAfford = UPGRADES.some((upgrade) => upgradeUnlocked(save, upgrade.id) && save.upgrades[upgrade.id] < upgrade.max && save.clovers >= upgrade.cost(save.upgrades[upgrade.id]))
    || FOREVER.some((def) => {
      const level = foreverLevel(save.forever, def.id);
      return level < def.max && Math.floor(save.cloverGems) >= def.cost(level);
    });
  const hasCraftable = CHARMS.some((charm) => canCraftCharm(save, charm.id)) || POTIONS.some((potion) => canBrewPotion(save, potion.id));
  const rebirthReady = canRebirth(save);
  const crystals = crystalUnlocked(save);
  const cursedOn = cursedUnlocked(save);
  const glitchedOn = glitchedUnlocked(save);
  // All-time play time: counted every 15 seconds while the tab is visible and we own the save.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!ownerRef.current || document.hidden) return;
      const current = saveRef.current;
      commit({ ...current, lifetime: { ...current.lifetime, playMs: current.lifetime.playMs + 15000 } });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [commit, ownerRef, saveRef]);

  useEffect(() => { sfx.enabled = save.sound; }, [save.sound]);
  useEffect(() => warmCloverSprites(TIERS, crystals, cursedOn, glitchedOn), [crystals, cursedOn, glitchedOn]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const visibility = () => {
      setPotionClock(Date.now());
      setVisible(!document.hidden);
      if (document.hidden) sfx.stopAll();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);

  useEffect(() => {
    const reward = save.offlineReward;
    if (sessionBlocked || !visible || !reward || shownOfflineReceipt.current === reward.id) return;
    shownOfflineReceipt.current = reward.id;
    setOfflineClaimError(false);
    modalRef.current = "offline";
    setModal("offline");
    particleRef.current?.clear();
  }, [save.offlineReward, sessionBlocked, visible]);

  const beginCooldown = useCallback((duration: number, now = performance.now()) => {
    readyAt.current = now + duration;
    window.clearTimeout(cooldownTimer.current);
    setCooldown((previous) => ({ active: true, duration, token: previous.token + 1 }));
    cooldownTimer.current = window.setTimeout(() => setCooldown((previous) => ({ ...previous, active: false })), duration);
  }, []);

  const burstFor = useCallback((result: RollResult, value: number) => {
    if (!effectsRef.current) return;
    const world = worldRef.current?.getBoundingClientRect();
    const button = buttonRef.current?.getBoundingClientRect();
    if (!world || !button) return;
    particleRef.current?.burst({
      x: button.left + button.width / 2 - world.left,
      y: button.top + button.height / 2 - world.top,
      tier: result.tier,
      variant: result.variant,
      value,
    });
  }, []);

  /**
   * One roll = one 3.2-second spin of the rarity rail. The outcome is decided
   * and saved the instant the spin starts; only the presentation waits for the
   * rail to stop. Manual clicks and the auto roller share the same rail, so
   * exactly one spin runs at a time.
   */
  const doRoll = useCallback((source: "manual" | "auto" = "manual") => {
    const now = performance.now();
    const gate = source === "auto" ? autoReadyAt : readyAt;
    // Extra input is rejected before any RNG, sound, DOM or state work happens.
    if (!ownerRef.current || now < gate.current || now < spinEndAt.current || modalRef.current || cinematicRef.current || document.hidden) return;
    const current = saveRef.current;
    if (source === "auto" && (!current.auto || !autoUnlocked(current))) return;
    const rollAt = Date.now();
    const { next, result } = rollOnce(current, () => ++ids.current, rollAt);
    const tracked = trackQuests(addLifetime(next, result, source === "manual"), result, rollAt);
    if (!commit(tracked.save)) return;
    // Rare results crawl into place: the reel runs longer and the world dims first.
    const level = revealLevel(result);
    const extra = effectsRef.current ? SUSPENSE_MS[level] : 0;
    const duration = ROLL_DURATION + extra;
    beginCooldown(duration, now);
    spinEndAt.current = now + duration;
    autoReadyAt.current = Math.max(autoReadyAt.current, now + autoInterval(current, rollAt) + extra);
    if (!document.hidden) sfx.spin(duration / 1000);
    window.clearTimeout(suspenseTimer.current);
    if (level > 0 && extra > 0) {
      suspenseTimer.current = window.setTimeout(() => {
        setSuspense(level);
        if (!document.hidden) sfx.suspense((extra + 1200) / 1000);
      }, Math.max(0, duration - extra - 1200));
    }
    // Finishing a quest never pays by itself: the player claims it in the Quests window.
    for (const done of tracked.ready) {
      window.setTimeout(() => {
        sfx.chime();
        pushToast({ title: "QUEST READY", text: `${describeQuest(done, fmt)} / CLAIM +${done.reward} TICKETS`, hue: 330, icon: "ticket" });
      }, duration + 200);
    }
    if (result.lucky) sfx.lucky();

    // The rail: random fillers drawn from the player's real odds, with the true result at the marker.
    const probabilities = tierProbabilities(getLuck(current, rollAt) * result.luckyMultiplier);
    const fillerChances = getVariantChances(current, rollAt, result.luckyMultiplier);
    const items = Array.from({ length: SPIN_ITEMS }, (_, i) =>
      i === SPIN_TARGET
        ? { tier: result.tier, variant: result.variant }
        : { tier: drawTier(probabilities), variant: sampleVariant(fillerChances) });
    const winHue = result.variant === "glitched" ? 185 : result.variant === "cursed" ? 345 : result.variant === "crystal" ? 203 : TIERS[result.tier].hue;
    setSpin({ key: ++spinKey.current, active: true, lucky: result.lucky, luckyMultiplier: result.luckyMultiplier, items, jitter: (Math.random() - 0.5) * 26, hue: winHue, duration, suspense: extra > 0 });

    window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => {
      spinEndAt.current = 0;
      setSpin((previous) => ({ ...previous, active: false }));
      if (effectsRef.current) {
        glyphAnimation.current?.cancel();
        glyphAnimation.current = glyphRef.current?.animate([
          { transform: "scale(1) rotate(0deg)" },
          { transform: "scale(0.91) rotate(-3deg)", offset: 0.25 },
          { transform: "scale(1.045) rotate(2deg)", offset: 0.65 },
          { transform: "scale(1) rotate(0deg)" },
        ], { duration: 360, easing: "ease-out" }) ?? null;
      }
      setFeed((previous) => [result, ...previous].slice(0, FEED_LIMIT));
      setLastRoll({ tier: result.tier, variant: result.variant });
      const crystal = result.variant === "crystal";
      const data: RevealData = { key: result.id, tier: result.tier, variant: result.variant, lucky: result.lucky, luckyMultiplier: result.luckyMultiplier, crit: result.crit, critMultiplier: result.critMultiplier, value: result.value, isNew: result.isNew, material: result.material, materialAmount: result.materialAmount, odds: result.odds };
      setSuspense(0);
      if (!document.hidden && !modalRef.current) sfx.roll(result.tier, result.variant === "shiny", result.crit, crystal, result.variant === "cursed", result.variant === "glitched");
      if (level > 0 && !modalRef.current && !document.hidden) {
        // The big moment: a full-screen reveal that holds until it's dismissed or times out.
        window.clearTimeout(bannerTimer.current);
        setBanner(null);
        cinematicRef.current = { at: performance.now() };
        setCinematic({ result, level });
        sfx.reveal(level as 1 | 2 | 3);
        window.clearTimeout(cinematicTimer.current);
        cinematicTimer.current = window.setTimeout(() => { cinematicRef.current = null; setCinematic(null); }, REVEAL_HOLD_MS[level]);
      } else if (result.lucky || TIERS[result.tier].drama >= 1 || result.variant !== "normal" || result.isNew) {
        window.clearTimeout(bannerTimer.current);
        setBanner(data);
        // Glitched finds hold the banner longer so its animation can play out.
        bannerTimer.current = window.setTimeout(() => setBanner(null), result.variant === "glitched" ? 3400 : 1800);
      }
      if (result.variant === "glitched" && effectsRef.current) {
        window.clearTimeout(flashTimer.current);
        setGlitchFlash((n) => n + 1);
        flashTimer.current = window.setTimeout(() => setGlitchFlash(0), 820);
      }
      burstFor(result, result.value);
    }, duration);
  }, [beginCooldown, burstFor, commit, ownerRef, pushToast, saveRef]);

  /** Drops an in-flight spin (the outcome is already saved) after a rebirth or reset. */
  const cancelSpin = useCallback(() => {
    window.clearTimeout(spinTimer.current);
    window.clearTimeout(suspenseTimer.current);
    spinEndAt.current = 0;
    setSuspense(0);
    setSpin(makeRestingSpin());
  }, []);

  const dismissCinematic = useCallback((force = false) => {
    const open = cinematicRef.current;
    if (!open || (!force && performance.now() - open.at < REVEAL_LOCK_MS)) return;
    window.clearTimeout(cinematicTimer.current);
    cinematicRef.current = null;
    setCinematic(null);
  }, []);

  // World events and the daily refresh: checked every few seconds while you play.
  useEffect(() => {
    const tick = () => {
      if (!ownerRef.current || document.hidden) return;
      const current = saveRef.current;
      const now = Date.now();
      const next = ensureQuests(maybeStartEvent(current, now), now);
      if (next === current) return;
      const started = activeEvent(next, now);
      const isNewEvent = started && next.event?.startedAt !== current.event?.startedAt;
      if (!commit(next)) return;
      persistNow();
      if (isNewEvent) {
        sfx.chime();
        pushToast({ title: started.name, text: `${started.blurb} FOR 2 MINUTES`, hue: started.hue, icon: started.icon });
      }
    };
    tick();
    const timer = window.setInterval(tick, 3000);
    return () => window.clearInterval(timer);
  }, [commit, persistNow, pushToast, ownerRef, saveRef, status]);

  // Auto roll uses the same single-spin rail and only starts after the manual unlock.
  useEffect(() => {
    if (sessionBlocked || !save.auto || !unlockedAuto || modal || !visible) return;
    let timer = 0;
    const tick = () => {
      doRoll("auto");
      timer = window.setTimeout(tick, Math.max(autoInterval(saveRef.current), autoReadyAt.current - performance.now() + 4));
    };
    timer = window.setTimeout(tick, Math.max(autoInterval(save), autoReadyAt.current - performance.now() + 4));
    return () => window.clearTimeout(timer);
  }, [save.auto, unlockedAuto, save.upgrades.auto, save.potions.active?.id, save.potions.active?.startedAt, modal, visible, doRoll, sessionBlocked, saveRef]);

  // Handlers change every render; the key listener reads the latest through a ref.
  const actionsRef = useRef<{ toggleAuto: () => void; openModal: (name: ModalName) => void; closeModal: () => void }>(null!);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (!ownerRef.current) return;
      if (cinematicRef.current) {
        if (["Space", "Enter", "Escape"].includes(event.code)) { event.preventDefault(); if (!event.repeat) dismissCinematic(); }
        return;
      }
      if (event.code === "Escape") {
        if (modalRef.current) actionsRef.current.closeModal();
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const shortcut = KEY_MODALS[event.code];
      if (shortcut) {
        event.preventDefault();
        if (event.repeat) return;
        if (modalRef.current === shortcut) actionsRef.current.closeModal();
        else if (!modalRef.current) actionsRef.current.openModal(shortcut);
        return;
      }
      if (event.code === "KeyA") {
        if (!modalRef.current && !event.repeat) actionsRef.current.toggleAuto();
        return;
      }
      if (event.code !== "Space" || modalRef.current) return;
      if (target instanceof HTMLElement && target.closest("button") && target !== buttonRef.current) return;
      event.preventDefault();
      if (event.repeat) return; // holding Space never repeats
      doRoll("manual");
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [doRoll, dismissCinematic, ownerRef]);

  useEffect(() => () => {
    window.clearTimeout(cooldownTimer.current);
    window.clearTimeout(bannerTimer.current);
    window.clearTimeout(burstTimer.current);
    window.clearTimeout(flashTimer.current);
    window.clearTimeout(spinTimer.current);
    window.clearTimeout(cinematicTimer.current);
    window.clearTimeout(suspenseTimer.current);
    glyphAnimation.current?.cancel();
    sfx.stopAll();
  }, []);

  const closeModal = () => { modalRef.current = null; setModal(null); };
  const openModal = (name: ModalName, view: "charms" | "brewery" | "tickets" | "upgrades" = "charms") => {
    if (!ownerRef.current) return;
    sfx.open();
    if (name === "forge") setForgeView(view === "brewery" ? "brewery" : "charms");
    if (name === "shop") setShopView(view === "tickets" ? "tickets" : "upgrades");
    modalRef.current = name;
    setModal(name);
    if (name === "offline") setOfflineClaimError(false);
    particleRef.current?.clear();
  };

  const buy = (id: UpgradeId, max = false) => {
    if (!ownerRef.current) return;
    const next = purchaseUpgrade(saveRef.current, id, max);
    if (!next) return sfx.deny();
    if (!commit(next)) return;
    persistNow();
    sfx.buy();
  };

  /** Forever upgrades are bought with clover gems and outlive every rebirth. */
  const buyForever = (id: ForeverId, max = false) => {
    if (!ownerRef.current) return;
    const next = purchaseForever(saveRef.current, id, max);
    if (!next) return sfx.deny();
    if (!commit(next)) return;
    persistNow();
    sfx.buy();
  };

  /** Spends quest tickets on a repeatable clover pack. */
  const buyPack = (id: CloverPackId): boolean => {
    if (!ownerRef.current) return false;
    const next = purchaseCloverPack(saveRef.current, id);
    if (!next) { sfx.deny(); return false; }
    if (!commit(next)) return false;
    persistNow();
    return true;
  };

  /** Doubles luck for tickets, up to x4096. */
  const buyLuck = (): boolean => {
    if (!ownerRef.current) return false;
    const next = purchaseLuckDoubler(saveRef.current);
    if (!next) return false;
    if (!commit(next)) return false;
    persistNow();
    return true;
  };

  const claimOne = (scope: "daily" | "weekly", index: number): number | null => {
    if (!ownerRef.current) return null;
    const claim = claimQuest(saveRef.current, scope, index);
    if (!claim || !commit(claim.save)) { sfx.deny(); return null; }
    persistNow();
    sfx.claim(claim.tickets);
    return claim.tickets;
  };
  const claimBonusTickets = (scope: "daily" | "weekly"): number | null => {
    if (!ownerRef.current) return null;
    const claim = claimBonus(saveRef.current, scope);
    if (!claim || !commit(claim.save)) { sfx.deny(); return null; }
    persistNow();
    sfx.claim(claim.tickets);
    return claim.tickets;
  };
  const claimEverything = (): number | null => {
    if (!ownerRef.current) return null;
    const claim = claimAll(saveRef.current);
    if (!claim || !commit(claim.save)) { sfx.deny(); return null; }
    persistNow();
    sfx.claim(claim.tickets);
    return claim.tickets;
  };

  /** Tester tools go through the same commit path as normal play. */
  const adminApply = (_label: string, fn: (s: any) => any) => {
    if (!ownerRef.current) return;
    if (commit(fn(saveRef.current))) { persistNow(); sfx.buy(); }
  };

  const toggleAuto = () => {
    if (!ownerRef.current) return;
    const current = saveRef.current;
    if (!autoUnlocked(current)) return sfx.deny();
    sfx.click();
    commit({ ...current, auto: !current.auto });
    persistNow();
  };

  actionsRef.current = { toggleAuto, openModal, closeModal };

  const forgeCharm = (id: CharmId): boolean => {
    if (!ownerRef.current) return false;
    const next = craftCharm(saveRef.current, id);
    if (!next) { sfx.deny(); return false; }
    if (!commit(next)) return false;
    persistNow();
    sfx.craft();
    return true;
  };

  const equipCharm = (id: CharmId): boolean => {
    if (!ownerRef.current) return false;
    const next = toggleCharm(saveRef.current, id);
    if (!next) { sfx.deny(); return false; }
    if (!commit(next)) return false;
    persistNow();
    sfx.click();
    return true;
  };

  const brew = (id: PotionId): boolean => {
    if (!ownerRef.current) return false;
    const next = brewPotion(saveRef.current, id);
    if (!next || !commit(next)) { sfx.deny(); return false; }
    persistNow();
    sfx.brew();
    return true;
  };

  const drink = (id: PotionId): boolean => {
    if (!ownerRef.current) return false;
    const now = Date.now();
    const next = drinkPotion(saveRef.current, id, now);
    if (!next || !commit(next)) { sfx.deny(); return false; }
    setPotionClock(now);
    // A speed potion changes the next auto pause, never the 500-manual-roll unlock.
    autoReadyAt.current = 0;
    persistNow();
    sfx.drink();
    return true;
  };

  // A timed potion uses real wall-clock time; hiding the tab never refreshes its duration.
  useEffect(() => {
    const stored = save.potions.active;
    if (!stored || sessionBlocked || !visible) return;
    const tick = () => {
      const now = Date.now();
      setPotionClock(now);
      const current = saveRef.current;
      const next = expirePotion(current, now);
      if (next !== current && commit(next)) persistNow();
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [save.potions.active, sessionBlocked, visible, commit, persistNow, saveRef]);

  const rebirth = () => {
    if (!ownerRef.current) return;
    const current = saveRef.current;
    if (!canRebirth(current)) return sfx.deny();
    if (!window.confirm(`Rebirth now for ${fmt(rebirthCost(current.rebirths))} clovers?\n\nThis wipes your clover currency and upgrades. Your index, materials, charms, potions and settings stay.`)) return;
    if (!commit(doRebirth(current))) return;
    persistNow();
    cancelSpin();
    setFeed([]);
    setLastRoll({ tier: 0, variant: "normal" });
    window.clearTimeout(burstTimer.current);
    setBanner(null);
    particleRef.current?.clear();
    window.clearTimeout(bannerTimer.current);
    closeModal();
    sfx.rebirth();
    beginCooldown(300);
  };

  const reset = () => {
    if (!window.confirm("Reset all clovers, clover gems, tickets, quests, forever upgrades, materials, upgrades, charms, potions, rebirths and discoveries?")) return;
    if (!ownerRef.current) return;
    const old = saveRef.current;
    if (!commit({ ...newSave(), sound: old.sound, performance: old.performance })) return;
    clearSave();
    persistNow();
    cancelSpin();
    setFeed([]);
    setLastRoll({ tier: 0, variant: "normal" });
    window.clearTimeout(burstTimer.current);
    setBanner(null);
    particleRef.current?.clear();
    window.clearTimeout(bannerTimer.current);
    closeModal();
  };

  const collectOffline = () => {
    const receipt = saveRef.current.offlineReward;
    if (!receipt) return closeModal();
    const collected = claimOffline(receipt.id);
    if (collected === null) { setOfflineClaimError(true); return; }
    setOfflineClaimError(false);
    closeModal();
    sfx.collectOffline();
    beginCooldown(220);
  };

  return (
    <main className={`world${!effects ? " low-effects" : ""}${uiBlocked || !visible ? " is-paused" : ""}${suspense ? ` is-suspense is-suspense-${suspense}` : ""}${activeEvent(save, Date.now()) ? ` is-event is-event-${save.event?.id}` : ""}`} ref={worldRef}>
      <div className="world-grid" aria-hidden="true" />
      <div className="world-glow" aria-hidden="true" />

      {/* ---------- TOP HUD ---------- */}
      <header className="hud-top" inert={uiBlocked}>
        <div className="hud-logo">
          <CloverImg tier={0} size="sm" className="logo-clover" />
          <span className="logo-copy">
            <span className="tx-stroke logo-title">CLOVER <em>RNG</em></span>
            <span className="tx-label logo-sub">ROLL FOR RARITY</span>
          </span>
        </div>

        <div className="hud-stats">
          <Block className="stat" faceClassName="stat-face">
            <CloverImg tier={0} size="sm" className="stat-icon" />
            <span className="stat-copy">
              <span className="tx-stroke stat-value">{fmt(save.clovers)}</span>
              <span className="tx-label">CLOVERS</span>
            </span>
          </Block>
          <Block className="stat" faceClassName="stat-face">
            <PixelIcon name="gem" className="stat-gem" />
            <span className="stat-copy">
              <span className={`tx-stroke stat-value is-gold${save.luckScale < 1 ? " is-dimmed" : ""}`}>x{luck < 0.01 ? luck.toFixed(3) : luck.toFixed(2)}</span>
              <span className="tx-label">LUCK</span>
            </span>
          </Block>
          {(save.rebirths > 0 || save.cloverGems > 0) && (
            <Block tone="dark" className="stat stat-gems" faceClassName="stat-face">
              <PixelIcon name="cloverGem" className="stat-gem" />
              <span className="stat-copy">
                <span className="tx-stroke stat-value is-gem">{fmt(save.cloverGems)}</span>
                <span className="tx-label">CLOVER GEMS</span>
              </span>
            </Block>
          )}
          {save.totalTickets > 0 && (
            <Block tone="dark" className="stat stat-tickets" faceClassName="stat-face">
              <PixelIcon name="ticket" className="stat-gem" />
              <span className="stat-copy">
                <span key={save.tickets} className="tx-stroke stat-value is-ticket">{fmt(save.tickets)}</span>
                <span className="tx-label">TICKETS</span>
              </span>
            </Block>
          )}
          {save.rebirths > 0 && (
            <Block tone="dark" className="stat stat-rebirth" faceClassName="stat-face">
              <PixelIcon name="rebirth" className="stat-gem" />
              <span className="stat-copy">
                <span className="tx-stroke stat-value is-fire">{save.rebirths}</span>
                <span className="tx-label">REBIRTHS</span>
              </span>
            </Block>
          )}
        </div>

        {livePotion && livePotionRecipe && <div className="brew-hud" inert={uiBlocked}>
          <BlockButton tone="tint" className="brew-hud-btn" faceClassName="brew-hud-face" style={{ "--h": livePotionRecipe.hue } as CSSProperties} onClick={() => openModal("forge", "brewery")} aria-label={`${livePotionRecipe.name} active, ${potionTime(livePotion.expiresAt - potionClock)} remaining`}>
            <PixelIcon name={livePotionRecipe.icon} className="brew-hud-icon" />
            <span className="brew-hud-copy"><span className="tx-stroke">{livePotionRecipe.name}</span><span className="tx-label" role="timer">{livePotionRecipe.power}</span><span className="tx-stroke brew-hud-time">{potionTime(livePotion.expiresAt - potionClock)}</span></span>
          </BlockButton>
        </div>}
        <div className="hud-actions">
          <BlockButton
            tone={save.auto ? "green" : "metal"}
            className="auto-btn"
            faceClassName="auto-btn-face"
            onClick={toggleAuto}
            disabled={!unlockedAuto}
            aria-pressed={save.auto}
            aria-label={unlockedAuto ? `Toggle auto roll, currently ${save.auto ? "on" : "off"}` : `Auto roll unlocks after ${AUTO_UNLOCK_ROLLS} manual rolls, ${save.lifetime.manualRolls} completed`}
            title={unlockedAuto ? "Toggle auto roll" : `Unlock auto roll: ${save.lifetime.manualRolls}/${AUTO_UNLOCK_ROLLS} manual rolls`}
          >
            <PixelIcon name="auto" muted={!save.auto} className="auto-btn-icon" />
            <span className="tx-stroke auto-btn-label">AUTO</span>
            <span className="tx-label auto-btn-state">{unlockedAuto ? save.auto ? "ON" : "OFF" : `${Math.min(save.lifetime.manualRolls, AUTO_UNLOCK_ROLLS)}/${AUTO_UNLOCK_ROLLS}`}</span>
          </BlockButton>
          <div className="offline-action">
            <BlockButton tone={save.offlineReward ? "gold" : "metal"} className="settings-btn offline-btn" faceClassName="settings-face" onClick={() => openModal("offline")} aria-label={save.offlineReward ? `${fmt(save.offlineReward.amount)} offline clovers ready to collect` : "View offline earnings"} title="Offline earnings">
              <PixelIcon name="offline" />
            </BlockButton>
            {save.offlineReward && <Block tone="green" className="offline-badge" faceClassName="offline-badge-face"><span className="tx-stroke">+</span></Block>}
          </div>
          <BlockButton className="settings-btn" faceClassName="settings-face" onClick={() => openModal("settings")} aria-label="Open settings">
            <PixelIcon name="gear" />
          </BlockButton>
        </div>
      </header>

      {/* ---------- LEFT DOCK ---------- */}
      <nav className="dock" aria-label="Game menu" inert={uiBlocked}>
        <div className="dock-item">
          <BlockButton className="dock-btn" faceClassName="dock-face" onClick={() => openModal("shop")} aria-label="Open shop">
            <PixelIcon name="bag" className="dock-icon" />
            <span className="tx-stroke dock-label">SHOP</span>
          </BlockButton>
          {canAfford && <Block tone="red" className="dock-badge" faceClassName="dock-badge-face"><span className="tx-stroke">!</span></Block>}
        </div>

        <div className="dock-item">
          <BlockButton className="dock-btn" faceClassName="dock-face" onClick={() => openModal("index")} aria-label={`Open clovers collection: ${found} of ${TOTAL_ENTRIES} discovered`}>
            <CloverImg tier={0} size="md" effects={false} sparkles={false} className="dock-clover-icon" />
            <span className="tx-stroke dock-label">CLOVERS</span>
          </BlockButton>
          <Block tone="tint" className="dock-badge is-wide" faceClassName="dock-badge-face" style={{ "--h": 272 } as CSSProperties}>
            <span className="tx-stroke">{found}/{TOTAL_ENTRIES}</span>
          </Block>
        </div>

        <div className="dock-item">
          <BlockButton tone={hasCraftable ? "gold" : "metal"} className="dock-btn" faceClassName="dock-face" onClick={() => openModal("forge", "charms")} aria-label="Open forge, charms and brewery">
            <PixelIcon name="forge" className="dock-icon" />
            <span className="tx-stroke dock-label">FORGE</span>
          </BlockButton>
          {breweryUnlocked(save) && livePotion && <Block tone="tint" className="dock-badge is-wide" faceClassName="dock-badge-face" style={{ "--h": 330 } as CSSProperties}><span className="tx-stroke">{potionTime(livePotion.expiresAt - potionClock)}</span></Block>}
          {!livePotion && hasCraftable && <Block tone="gold" className="dock-badge" faceClassName="dock-badge-face"><span className="tx-stroke">!</span></Block>}
        </div>

        <div className="dock-item">
          <BlockButton tone={claimable ? "gold" : "metal"} className={`dock-btn quests-dock${claimable ? " is-ready" : ""}`} faceClassName="dock-face" onClick={() => openModal("quests")} aria-label={claimable ? `Open quests, ${claimable} ready to claim` : "Open quests"}>
            <PixelIcon name="quests" className="dock-icon" />
            <span className="tx-stroke dock-label">QUESTS</span>
          </BlockButton>
          {claimable > 0 && <Block tone="red" className="dock-badge" faceClassName="dock-badge-face"><span className="tx-stroke">{claimable}</span></Block>}
        </div>

        <div className="dock-item">
          <BlockButton tone={rebirthReady ? "tint" : "metal"} style={rebirthReady ? ({ "--h": REBIRTH_HUE } as CSSProperties) : undefined} className={`dock-btn rebirth-dock${rebirthReady ? " is-ready" : ""}`} faceClassName="dock-face" onClick={() => openModal("rebirth")} aria-label={rebirthReady ? "Rebirth is ready" : "Open rebirth"}>
            <PixelIcon name="rebirth" className="dock-icon" />
            <span className="tx-stroke dock-label">REBIRTH</span>
          </BlockButton>
          {rebirthReady ? (
            <Block tone="tint" className="dock-badge" faceClassName="dock-badge-face" style={{ "--h": REBIRTH_HUE } as CSSProperties}><span className="tx-stroke">!</span></Block>
          ) : save.rebirths > 0 ? (
            <Block tone="dark" className="dock-badge is-wide" faceClassName="dock-badge-face"><span className="tx-stroke">{save.rebirths}</span></Block>
          ) : null}
        </div>

        <div className="dock-item history-dock">
          <BlockButton className="dock-btn" faceClassName="dock-face" onClick={() => openModal("history")} aria-label="Open recent rolls">
            <PixelIcon name="log" className="dock-icon" />
            <span className="tx-stroke dock-label">LOG</span>
          </BlockButton>
        </div>
      </nav>

      {/* ---------- RIGHT FEED ---------- */}
      <aside className="feed" aria-label="Recent rolls" inert={uiBlocked}>
        <GoalPanel save={save} />
        <Block faceClassName="feed-face">
          <span className="tx-stroke feed-title">RECENT ROLLS</span>
          <RollHistory feed={feed} compact />
        </Block>
      </aside>

      {/* ---------- CENTER STAGE ---------- */}
      <section className="play-space" aria-label="Clover roller" inert={uiBlocked}>
        <div className={`stage stage-${shownTier.id}${shownCrystal ? " is-crystal-stage" : ""}${shownCursed ? " is-cursed-stage" : ""}${shownGlitched ? " is-glitched-stage" : ""}`} style={{ "--h": shownGlitched ? 185 : shownCursed ? 345 : shownCrystal ? 203 : shownTier.hue } as CSSProperties}>
          <div className="stage-light" aria-hidden="true" />

          <button
            ref={buttonRef}
            className={`luck-button${cooldown.active ? " is-cooling" : ""}`}
            type="button"
            disabled={cooldown.active || sessionBlocked}
            onPointerDown={() => {
              if (cooldown.active || sessionBlocked) return;
              sfx.press();
              if (navigator.vibrate) navigator.vibrate(8);
            }}
            onClick={() => doRoll("manual")}
            onKeyDown={(event) => { if (event.repeat && (event.code === "Enter" || event.code === "Space")) event.preventDefault(); }}
            onKeyUp={(event) => { if (event.code === "Space") event.preventDefault(); }}
            onPointerEnter={(event) => { pointerBounds.current = event.currentTarget.getBoundingClientRect(); }}
            onPointerMove={(event) => {
              if (!effects || event.pointerType !== "mouse" || !pointerBounds.current) return;
              const rect = pointerBounds.current;
              const x = clampUnit((event.clientX - rect.left) / rect.width - 0.5);
              const y = clampUnit((event.clientY - rect.top) / rect.height - 0.5);
              // The tilt snaps to blocky 4-degree steps, like the pixel edges.
              const ry = Math.round(x * 3) * 4;
              const rx = Math.round(-y * 3) * 4;
              event.currentTarget.style.setProperty("--ry", `${ry}deg`);
              event.currentTarget.style.setProperty("--rx", `${rx}deg`);
            }}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty("--ry", "0deg");
              event.currentTarget.style.setProperty("--rx", "0deg");
              pointerBounds.current = null;
            }}
            aria-label={`Roll for a clover. Last roll: ${variantPrefix(lastRoll.variant).toLowerCase()}${shownTier.name}. Luck x${luck.toFixed(2)}.`}
            aria-keyshortcuts="Space Enter"
          >
            <span className="hex-frame" aria-hidden="true">
              <span className="hex-face">
                <span ref={glyphRef} className="clover-pop">
                  <CloverImg tier={lastRoll.tier} variant={lastRoll.variant} size="lg" className="hero-clover" animated={effects && !modal} effects={effects} />
                </span>
              </span>
            </span>
            <span className="button-shadow" aria-hidden="true" />
          </button>

          <span className="stage-spark stage-spark-one" aria-hidden="true" />
          <span className="stage-spark stage-spark-two" aria-hidden="true" />
          <span className="stage-spark stage-spark-three" aria-hidden="true" />
          <span className="stage-spark stage-spark-four" aria-hidden="true" />
        </div>

        <SpinRail spin={spin} effects={effects} />
        <div className={`lucky-meter${spin.active && spin.lucky ? " is-lucky" : ""}`} aria-live="polite">
          <PixelIcon name="luckyRoll" className="lucky-meter-icon" />
          <span className="lucky-meter-copy">
            <span className="tx-stroke">{spin.active && spin.lucky ? "LUCKY ROLL!" : "NEXT LUCKY ROLL"}</span>
            <span className="tx-label">{spin.active && spin.lucky ? `x${spin.luckyMultiplier.toFixed(2)} LUCK ON THIS SPIN` : `x${luckyMultiplier(save).toFixed(2)} LUCK / EVERY ${luckyInterval(save)} ROLLS`}</span>
          </span>
          <span className="tx-stroke lucky-meter-count">{spin.active && spin.lucky ? "NOW" : `IN ${rollsUntilLucky(save)}`}</span>
          <span className="lucky-meter-bar px" aria-hidden="true"><i style={{ width: `${(spin.active && spin.lucky ? 1 : Math.min(1, save.luckyProgress / luckyInterval(save))) * 100}%` }} /></span>
        </div>
        {!unlockedAuto && <p className="tx-label auto-unlock-hint">AUTO ROLL UNLOCKS AT {Math.min(save.lifetime.manualRolls, AUTO_UNLOCK_ROLLS)}/{AUTO_UNLOCK_ROLLS} MANUAL ROLLS</p>}
        <div className="key-legend" aria-label="Keyboard shortcuts">
          {KEY_LEGEND.map(([key, label]) => (
            <span key={key} className="key-legend-item"><kbd className="key-cap">{key}</kbd><span className="tx-label">{label}</span></span>
          ))}
        </div>
      </section>

      {/* ---------- FX ---------- */}
      <ParticleCanvas ref={particleRef} enabled={effects} paused={uiBlocked || !visible} />
      {banner && !modal && !sessionBlocked && <RevealBanner key={banner.key} data={banner} />}
      {glitchFlash > 0 && effects && (
        <div key={glitchFlash} className="glitch-flash" aria-hidden="true">
          <i className="glitch-flash-bar glitch-flash-bar-a" /><i className="glitch-flash-bar glitch-flash-bar-b" /><i className="glitch-flash-bar glitch-flash-bar-c" />
        </div>
      )}

      {toasts.length > 0 && (
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <Block key={t.id} tone="tint" className="toast" faceClassName="toast-face" style={{ "--h": t.hue } as CSSProperties}>
              <PixelIcon name={t.icon} className="toast-icon" />
              <span className="toast-copy"><span className="tx-stroke toast-title">{t.title}</span><span className="tx-label">{t.text}</span></span>
            </Block>
          ))}
        </div>
      )}
      {cinematic && <RareReveal key={cinematic.result.id} result={cinematic.result} level={cinematic.level} effects={effects} onDismiss={() => dismissCinematic()} />}

      {modal === "shop" && <ShopModal save={save} onBuy={(id) => buy(id)} onBuyMax={(id) => buy(id, true)} onBuyForever={(id) => buyForever(id)} onBuyForeverMax={(id) => buyForever(id, true)} onBuyPack={buyPack} onBuyLuck={buyLuck} initialView={shopView} onClose={closeModal} />}
      {modal === "quests" && <QuestsModal save={save} onClaim={claimOne} onClaimBonus={claimBonusTickets} onClaimAll={claimEverything} onOpenCloverShop={() => openModal("shop", "tickets")} onClose={closeModal} />}
      {modal === "admin" && <AdminPanel save={save} apply={adminApply} onClose={closeModal} />}
      {modal === "index" && <IndexModal save={save} onClose={closeModal} />}
      {modal === "forge" && <CharmForge save={save} initialView={forgeView} now={potionClock} storageEnabled={storageEnabled} saveError={saveError} onCraft={forgeCharm} onToggle={equipCharm} onBrew={brew} onDrink={drink} onClose={closeModal} />}
      {modal === "rebirth" && <RebirthModal save={save} onRebirth={rebirth} onOpenBrewery={() => openModal("forge", "brewery")} onClose={closeModal} />}
      {modal === "offline" && !sessionBlocked && <OfflineModal save={save} effects={effects} storageEnabled={storageEnabled} claimError={offlineClaimError} onClaim={collectOffline} onEnableAuto={() => { const current = saveRef.current; if (autoUnlocked(current) && commit({ ...current, auto: true })) { persistNow(); sfx.click(); closeModal(); } }} onClose={closeModal} />}
      {modal === "history" && (
        <Modal title="RECENT ROLLS" headTone="tint" headHue={199} icon="log" onClose={closeModal}>
          <RollHistory feed={feed} />
        </Modal>
      )}
      {modal === "settings" && (
        <SettingsModal
          save={save}
          onToggleSound={() => { const next = !saveRef.current.sound; sfx.enabled = next; commit({ ...saveRef.current, sound: next }); if (next) sfx.click(); }}
          onTogglePerformance={() => { sfx.click(); commit({ ...saveRef.current, performance: !saveRef.current.performance }); }}
          onLuckScale={(scale) => { commit({ ...saveRef.current, luckScale: scale }); }}
          onReset={reset}
          onAdmin={() => openModal("admin")}
          onClose={closeModal}
        />
      )}
      {sessionBlocked && visible && <Modal title={status === "other-tab" ? "ONE SAVE. ONE SESSION." : "LOADING YOUR SAVE"} headTone="gold" icon="offline" onClose={retrySession} dismissible={false} className="session-modal">
        <div className="session-notice">
          <PixelIcon name="offline" className="session-icon" />
          <span className="tx-stroke">{status === "other-tab" ? "YOUR CLOVERS ARE SAFE" : "JUST A MOMENT..."}</span>
          <p>{status === "other-tab" ? "This game is active in another tab. Close or switch away from that tab to continue here. Your rewards can only be collected once." : "Checking your saved progress and offline rewards."}</p>
          {status === "other-tab" && <BlockButton tone="green" className="session-retry" faceClassName="session-retry-face" onClick={retrySession}><span className="tx-stroke">TRY AGAIN</span></BlockButton>}
          {saveError && <p className="offline-error">Browser storage could not be accessed. Please check your browser settings.</p>}
        </div>
      </Modal>}
    </main>
  );
}

const clampUnit = (n: number) => Math.max(-0.5, Math.min(0.5, n));

/**
 * The horizontal rarity rail. Remounts per spin (key), starts at rest and
 * decelerates over the full roll so the marked result lands under the pointer.
 */
function SpinRail({ spin, effects }: { spin: SpinState; effects: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);

  // The reel stops just before the reveal; the last beat is a colour hit on the winning slot.
  useEffect(() => {
    setLanded(false);
    if (spin.key === 0) return;
    const timer = window.setTimeout(() => setLanded(true), spin.duration - SPIN_SETTLE);
    return () => window.clearTimeout(timer);
  }, [spin.key, spin.duration]);

  useLayoutEffect(() => {
    const rail = railRef.current;
    const strip = stripRef.current;
    const cell = strip?.children[0] as HTMLElement | undefined;
    if (!rail || !strip || !cell) return;
    const gap = parseFloat(getComputedStyle(strip).columnGap || "8") || 8;
    const pad = parseFloat(getComputedStyle(strip).paddingLeft || "8") || 8;
    const target = pad + SPIN_TARGET * (cell.offsetWidth + gap) + cell.offsetWidth / 2;
    const dx = Math.max(0, target - rail.clientWidth / 2 + spin.jitter);
    // keep the result under the marker if the window is resized after landing
    const resettle = () => {
      const w = cell.offsetWidth, g = parseFloat(getComputedStyle(strip).columnGap || "8") || 8, p = parseFloat(getComputedStyle(strip).paddingLeft || "8") || 8;
      strip.style.transition = "none";
      strip.style.transform = `translateX(${-Math.max(0, p + SPIN_TARGET * (w + g) + w / 2 - rail.clientWidth / 2 + spin.jitter)}px)`;
    };
    window.addEventListener("resize", resettle);
    if (spin.key === 0 || !effects) {
      resettle();
      return () => window.removeEventListener("resize", resettle);
    }
    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        // suspense spins ease harder, so the last cells creep past the marker one by one
        strip.style.transition = `transform ${spin.duration - SPIN_SETTLE}ms ${spin.suspense ? "cubic-bezier(0.06, 0.78, 0.03, 1)" : "cubic-bezier(0.1, 0.72, 0.12, 1)"}`;
        strip.style.transform = `translateX(${-dx}px)`;
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); window.removeEventListener("resize", resettle); };
  }, [spin.key, spin.jitter, spin.duration, spin.suspense, effects]);

  const targetItem = spin.items[SPIN_TARGET];
  const caption = spin.active
    ? spin.lucky ? `LUCKY ROLL / x${spin.luckyMultiplier.toFixed(2)} LUCK` : "ROLLING"
    : spin.key === 0
      ? "READY TO ROLL"
      : `${variantPrefix(targetItem.variant)}${TIERS[targetItem.tier].name.toUpperCase()}`;

  return (
    <div className={`spin-rail${spin.active ? " is-spinning" : " is-idle"}${landed ? " is-landed" : ""}${spin.lucky ? " is-lucky" : ""}${spin.suspense && spin.active ? " is-suspense" : ""}`} style={{ "--win": spin.hue } as CSSProperties} aria-hidden="true">
      <Block tone="dark" className="spin-frame" faceClassName="spin-frame-face">
        <span className="tx-label spin-caption">{caption}</span>
        <div ref={railRef} className="spin-window px">
          <div ref={stripRef} className="spin-strip">
            {spin.items.map((item, index) => {
              const tier = TIERS[item.tier];
              const hue = item.variant === "glitched" ? 185 : item.variant === "cursed" ? 345 : item.variant === "crystal" ? 203 : tier.hue;
              return (
                <span
                  key={index}
                  className={`spin-cell px${index === SPIN_TARGET ? " is-target" : ""}`}
                  style={{ "--h": hue, "--rc": item.variant === "normal" && !tier.rainbow ? tier.color : "#ffffff" } as CSSProperties}
                >
                  <CloverImg tier={item.tier} variant={item.variant} size="sm" sparkles={false} effects={false} className="spin-clover" />
                  <i className="spin-cell-bar" />
                </span>
              );
            })}
          </div>
          <i className="spin-fade spin-fade-l" />
          <i className="spin-fade spin-fade-r" />
          <i className="spin-beam" />
        </div>
      </Block>
      <i className="spin-marker spin-marker-top" />
      <i className="spin-marker spin-marker-bottom" />
    </div>
  );
}
