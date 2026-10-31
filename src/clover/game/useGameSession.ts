// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEY, loadSave, storeSave, type Save } from "./data";
import { redeemOfflineReward, settleOfflineEarnings } from "./offline";

export type SessionStatus = "loading" | "active" | "other-tab";
const SESSION_LOCK = "clover-rng-active-session";
const LEASE_KEY = "clover-rng-session-lease";
const LEASE_MS = 15000;
type Lease = { owner: string; expires: number };

function supportsStorage(): boolean {
  try {
    const key = "clover-rng-storage-check";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readLease(): Lease | null {
  try {
    const lease = JSON.parse(localStorage.getItem(LEASE_KEY) ?? "null") as Lease | null;
    return lease && typeof lease.owner === "string" && Number.isFinite(lease.expires) ? lease : null;
  } catch {
    return null;
  }
}

// One visible tab writes a profile. The session lock also makes rewarding an
// absence and clearing a claimed receipt indivisible across cooperating tabs.
export function useGameSession() {
  const [save, setSave] = useState<Save>(loadSave);
  const saveRef = useRef(save);
  const [storageEnabled, setStorageEnabled] = useState(supportsStorage);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [saveError, setSaveError] = useState(false);
  const ownerRef = useRef(false);
  const guardRef = useRef<() => boolean>(() => false);
  const retryRef = useRef<() => void>(() => undefined);

  const commit = useCallback((next: Save): boolean => {
    if (!ownerRef.current || !guardRef.current()) return false;
    const checkpoint = { ...next, lastActiveAt: Math.max(next.lastActiveAt, saveRef.current.lastActiveAt, Date.now()) };
    saveRef.current = checkpoint;
    setSave(checkpoint);
    return true;
  }, []);

  const persistNow = useCallback((): boolean => {
    if (!ownerRef.current || !guardRef.current()) return false;
    const checkpoint = { ...saveRef.current, lastActiveAt: Math.max(saveRef.current.lastActiveAt, Date.now()) };
    saveRef.current = checkpoint;
    if (!storageEnabled) return false;
    const saved = storeSave(checkpoint);
    setSaveError(!saved);
    return saved;
  }, [storageEnabled]);

  const claimOffline = useCallback((receiptId: string): number | null => {
    if (!ownerRef.current || !guardRef.current() || !storageEnabled) return null;
    const current = saveRef.current;
    const next = redeemOfflineReward(current, receiptId);
    if (next === current) return null;
    // Persist wallet + cleared receipt together, before showing success.
    if (!storeSave(next)) {
      setSaveError(true);
      return null;
    }
    const amount = current.offlineReward!.amount;
    saveRef.current = next;
    setSave(next);
    setSaveError(false);
    return amount;
  }, [storageEnabled]);

  useEffect(() => {
    let disposed = false;
    let acquiring = false;
    let retryAfterRelease = false;
    let releaseLock: (() => void) | null = null;
    let leaseTimer = 0;
    let fallback = !navigator.locks;
    const tabId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}:${Math.random()}`;

    const updateSave = (next: Save) => {
      if (disposed) return;
      saveRef.current = next;
      setSave(next);
    };

    const activate = () => {
      if (disposed || document.hidden) return false;
      const next = storageEnabled ? settleOfflineEarnings(loadSave(), Date.now()) : saveRef.current;
      const saved = !storageEnabled || storeSave(next);
      updateSave(next);
      ownerRef.current = true;
      setSaveError(!saved);
      setStatus("active");
      return true;
    };

    const leave = () => {
      window.clearTimeout(leaseTimer);
      if (fallback) acquiring = false;
      else if (acquiring) retryAfterRelease = true;
      if (ownerRef.current) persistNow();
      ownerRef.current = false;
      guardRef.current = () => false;
      releaseLock?.();
      releaseLock = null;
      if (storageEnabled && readLease()?.owner === tabId) {
        try { localStorage.removeItem(LEASE_KEY); } catch { /* Storage may be restricted. */ }
      }
      if (!disposed) setStatus("loading");
    };

    const acquireFallback = () => {
      const now = Date.now();
      const lease = readLease();
      if (lease && lease.owner !== tabId && lease.expires > now) {
        acquiring = false;
        setStatus("other-tab");
        return;
      }
      try {
        localStorage.setItem(LEASE_KEY, JSON.stringify({ owner: tabId, expires: now + LEASE_MS }));
      } catch {
        acquiring = false;
        setSaveError(true);
        setStorageEnabled(false);
        return;
      }
      // Let simultaneous fallback candidates resolve to the same stored owner.
      leaseTimer = window.setTimeout(() => {
        acquiring = false;
        if (disposed || document.hidden) return;
        if (readLease()?.owner !== tabId) {
          setStatus("other-tab");
          return;
        }
        guardRef.current = () => readLease()?.owner === tabId;
        activate();
      }, 90 + Math.random() * 60);
    };

    const acquire = (): void => {
      if (disposed || document.hidden || ownerRef.current || acquiring) return;
      acquiring = true;
      if (!storageEnabled) {
        acquiring = false;
        guardRef.current = () => !disposed && !document.hidden;
        activate();
        return;
      }
      if (fallback) return acquireFallback();
      void navigator.locks.request(SESSION_LOCK, { ifAvailable: true }, async (lock) => {
        if (disposed || document.hidden) return;
        if (!lock) {
          setStatus("other-tab");
          return;
        }
        const existingLease = readLease();
        if (existingLease && existingLease.owner !== tabId && existingLease.expires > Date.now()) {
          setStatus("other-tab");
          return;
        }
        try {
          localStorage.setItem(LEASE_KEY, JSON.stringify({ owner: tabId, expires: Date.now() + LEASE_MS }));
        } catch {
          setSaveError(true);
          setStorageEnabled(false);
          return;
        }
        const held = new Promise<void>((resolve) => { releaseLock = resolve; });
        guardRef.current = () => ownerRef.current && !disposed && readLease()?.owner === tabId;
        if (!activate()) { releaseLock?.(); return; }
        await held;
      }).catch(() => {
        if (!disposed) fallback = true;
      }).finally(() => {
        acquiring = false;
        const retry = retryAfterRelease;
        retryAfterRelease = false;
        if (retry && !disposed && !document.hidden) acquire();
      });
    };

    const visibility = () => { if (document.hidden) leave(); else acquire(); };
    const pageShow = () => acquire();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && !ownerRef.current) updateSave(loadSave());
      if (event.key === LEASE_KEY) {
        if (ownerRef.current && !guardRef.current()) {
          leave();
          updateSave(loadSave());
          setStatus("other-tab");
        }
        acquire();
      }
    };

    retryRef.current = acquire;
    const monitor = window.setInterval(() => {
      if (disposed || document.hidden) return;
      if (!ownerRef.current) { acquire(); return; }
      if (storageEnabled) {
        if (!guardRef.current()) {
          leave();
          updateSave(loadSave());
          setStatus("other-tab");
          return;
        }
        try {
          localStorage.setItem(LEASE_KEY, JSON.stringify({ owner: tabId, expires: Date.now() + LEASE_MS }));
        } catch { setSaveError(true); }
      }
      persistNow();
    }, 2200);

    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", pageShow);
    window.addEventListener("storage", onStorage);
    acquire();

    return () => {
      leave();
      disposed = true;
      window.clearInterval(monitor);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", pageShow);
      window.removeEventListener("storage", onStorage);
      retryRef.current = () => undefined;
    };
  }, [persistNow, storageEnabled]);

  return { save, saveRef, commit, ownerRef, status, storageEnabled, saveError, persistNow, claimOffline, retrySession: () => retryRef.current() };
}